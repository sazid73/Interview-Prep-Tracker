import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker')
  .then(() => console.log('✅ Connected to MongoDB Database'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Database Schema & Models
// 1. Grid Data (The Calendar Slots)
const gridSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // Format: "YYYY-MM-DD-Time"
  color: String,
  textColor: String,
  slots: [
    {
      text: String,
      status: String,
      employeeDoneBy: String
    }
  ]
});
const GridCell = mongoose.model('GridCell', gridSchema);

// 2. Activity Logs
const logSchema = new mongoose.Schema({
  timestamp: String,
  user: String,
  action: String,
  details: String
});
const ActivityLog = mongoose.model('ActivityLog', logSchema);

// 2b. Cell Edit History
const cellHistorySchema = new mongoose.Schema({
  cellKey: String,
  slotIndex: Number,
  user: String,
  timestamp: String,
  oldText: String,
  newText: String
});
const CellHistory = mongoose.model('CellHistory', cellHistorySchema);

// 3. Users & Roles
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String }, // Plain text for simplicity, as per requirements
  role: { type: String, default: 'standard' } // 'standard', 'special', 'admin'
});
const User = mongoose.model('User', userSchema);

// =======================
// API ENDPOINTS
// =======================

// --- GRID ENDPOINTS ---

// GET: Fetch all grid data
app.get('/api/grid', async (req, res) => {
  try {
    const cells = await GridCell.find({});
    // Convert array of objects back into a mapping object: { "key": { color, slots } }
    const gridData = {};
    cells.forEach(cell => {
      gridData[cell.key] = {
        color: cell.color,
        textColor: cell.textColor,
        slots: cell.slots
      };
    });
    res.json(gridData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grid data' });
  }
});

// POST: Update or create a single grid cell
app.post('/api/grid/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { color, textColor, slots } = req.body;
    
    // Upsert (Update if exists, Insert if doesn't)
    await GridCell.findOneAndUpdate(
      { key },
      { color, textColor, slots },
      { upsert: true, new: true }
    );
    
    // Broadcast change to all connected users instantly
    io.emit('cell_updated', { key, cell: { color, textColor, slots } });
    
    res.json({ success: true, message: 'Cell updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cell' });
  }
});

// DELETE: Clear a specific month's data
app.delete('/api/grid/month', async (req, res) => {
  try {
    const { year, month } = req.query; // e.g. ?year=2026&month=4
    const prefixRegex = new RegExp(`^${year}-${month}-`);
    
    await GridCell.deleteMany({ key: prefixRegex });
    
    // Broadcast clear to all connected users
    io.emit('month_cleared', { year, month });
    
    res.json({ success: true, message: 'Month cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear month' });
  }
});

// --- LOGS ENDPOINTS ---

// GET: Fetch recent logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await ActivityLog.find({}).sort({ _id: -1 }).limit(200); // Get latest 200
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST: Create a new log
app.post('/api/logs', async (req, res) => {
  try {
    const { timestamp, user, action, details } = req.body;
    const newLog = new ActivityLog({ timestamp, user, action, details });
    await newLog.save();
    res.json({ success: true, message: 'Log created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// --- HISTORY ENDPOINTS ---
app.get('/api/history/:cellKey/:slotIndex', async (req, res) => {
  try {
    const history = await CellHistory.find({ 
      cellKey: req.params.cellKey, 
      slotIndex: req.params.slotIndex 
    }).sort({ _id: -1 }); // newest first
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const { cellKey, slotIndex, user, timestamp, oldText, newText } = req.body;
    const newEntry = new CellHistory({ cellKey, slotIndex, user, timestamp, oldText, newText });
    await newEntry.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create history' });
  }
});

// --- USERS & AUTH ENDPOINTS ---

// POST: Login / Register user
app.post('/api/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const normalizedName = name.trim();
    
    // Check if it's the very first user ever (Genesis Admin)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const genesisAdmin = new User({ name: 'Admin', password, role: 'admin' });
      await genesisAdmin.save();
      if (normalizedName.toLowerCase() === 'admin') {
        return res.json(genesisAdmin);
      }
    }

    let user = await User.findOne({ name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } });
    
    if (!user) {
      // Allow Genesis Admin creation even if db has legacy users
      if (normalizedName.toLowerCase() === 'admin') {
        user = new User({ name: 'Admin', password, role: 'admin' });
        await user.save();
        return res.json(user);
      }
      return res.status(401).json({ error: 'User does not exist. Ask the Admin to create an account for you.' });
    }

    // Migration for users created in the previous step without passwords
    if (!user.password) {
      user.password = password;
      await user.save();
    } else if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET: Fetch all users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST: Create new user (Admin only)
app.post('/api/users', async (req, res) => {
  try {
    const { name, password, role } = req.body;
    const normalizedName = name.trim();
    const existing = await User.findOne({ name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    
    const newUser = new User({ name: normalizedName, password, role });
    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT: Change user role
app.put('/api/users/:name/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findOneAndUpdate(
      { name: req.params.name },
      { role },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PUT: Change user password
app.put('/api/users/:name/password', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOneAndUpdate(
      { name: req.params.name },
      { password },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// DELETE: Remove user
app.delete('/api/users/:name', async (req, res) => {
  try {
    await User.findOneAndDelete({ name: req.params.name });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- SOCKET.IO REAL-TIME PRESENCE ---
io.on('connection', (socket) => {
  // When a user clicks into a slot
  socket.on('user_focus', (data) => {
    socket.broadcast.emit('user_focus', data);
  });
  
  // When a user clicks out of a slot
  socket.on('user_blur', (data) => {
    socket.broadcast.emit('user_blur', data);
  });
  
  // When a user is typing (instant google sheets sync)
  socket.on('user_typing', (data) => {
    socket.broadcast.emit('user_typing', data);
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
