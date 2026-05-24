import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
