import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker')
  .then(async () => {
    console.log('Connected to MongoDB Database');
    
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      password: { type: String },
      role: { type: String, default: 'standard' }
    });
    
    // We recreate the model or use it if it exists
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const usersData = [
      { name: "Fahmida", role: "team leader" },
      { name: "Sazid", role: "asst. team leader" },
      { name: "Isha", role: "recruiter" },
      { name: "Tasmiah", role: "prep coach" },
      { name: "Mohaimen", role: "recruiter" },
      { name: "Ahasan", role: "recruiter" },
      { name: "Omor", role: "chaser" },
      { name: "Rakin", role: "chaser" },
      { name: "Arnika", role: "recruiter" },
      { name: "Aryan", role: "recruiter" },
      { name: "Diya", role: "recruiter" },
      { name: "Dina", role: "admins for task assigns" },
      { name: "Apsara", role: "admins for task assigns" },
      { name: "Saad", role: "manager" },
      { name: "Choyon", role: "admins for task assigns" },
      { name: "Tamanna", role: "compliance" },
      { name: "Niloy", role: "admins for task assigns" },
      { name: "Mastura", role: "admins for task assigns" },
      { name: "Sadiqur", role: "admins for task assigns" },
      { name: "Sami", role: "technical officer" },
      { name: "Evan", role: "recruiter" },
      { name: "Arusa", role: "recruiter" },
      { name: "Alee", role: "recruiter" },
      { name: "Tunajjinah", role: "recruiter" }
    ];

    for (const u of usersData) {
      await User.findOneAndUpdate(
        { name: u.name },
        { name: u.name, password: "123456", role: u.role },
        { upsert: true, new: true }
      );
    }
    
    console.log('Users synced successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
