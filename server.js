const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ⚡ MongoDB Atlas Connection String
const CLOUD_MONGO_URI = ""; // 🔑 Add your MongoDB Atlas connection string here

mongoose.connect(CLOUD_MONGO_URI)
    .then(() => console.log('⚡ Connected to Cloud Atlas System Core'))
    .catch(err => console.error('🔴 Database connectivity error:', err));

// 📝 Schemas & Models
const ConfessionSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // 👈 Tracking user session owner
    name: String,
    instaId: String,
    contactNo: String,
    partnerName: String,
    description: String,
    secretQuestion: String,
    secretAnswer: String,
    date: { type: Date, default: Date.now }
});
const Confession = mongoose.model('Confession', ConfessionSchema);

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 🔐 Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: "Email already registered!" });
        const newUser = new User({ email, password });
        await newUser.save();
        res.json({ success: true, token: "mock-user-jwt-payload" });
    } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(400).json({ success: false, message: "Invalid email or password parameters." });
        res.json({ success: true, token: "mock-user-jwt-payload" });
    } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// 💌 Confessions Core Routes
app.post('/api/confessions', async (req, res) => {
    try {
        const newConf = new Confession(req.body);
        await newConf.save();
        res.status(201).json({ success: true });
    } catch (err) { res.status(400).json({ success: false, log: err.message }); }
});

app.get('/api/confessions/public', async (req, res) => {
    try {
        // userId ko bhi return kar rahe hain taaki frontend identity match kar sake
        const publicFeed = await Confession.find({}, 'name partnerName description secretQuestion userId _id').sort({ date: -1 });
        res.json(publicFeed);
    } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 🎯 Security Checkpoint (Unlock Route)
app.post('/api/confessions/:id/unlock', async (req, res) => {
    try {
        const { answer } = req.body;
        const confession = await Confession.findById(req.params.id);
        if (!confession) return res.status(404).json({ success: false, message: "Confession missing." });

        if (confession.secretAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
            res.json({ success: true, instaId: confession.instaId });
        } else {
            res.json({ success: false, message: "Verification failed." });
        }
    } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 👑 Secure Admin Dashboard Matrix
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const fullRegistry = await Confession.find({}).sort({ date: -1 });
        res.json(fullRegistry);
    } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 🗑️ NEW: Confession Delete API Route (Admin & Particular User Power)
app.delete('/api/confessions/:id', async (req, res) => {
    try {
        const { userId, isAdmin } = req.body;
        const confession = await Confession.findById(req.params.id);
        
        if (!confession) {
            return res.status(404).json({ success: false, message: "Confession parameters not found." });
        }

        // Aur ab security filter check hoga...
        if (isAdmin === true || confession.userId === userId) {
            await Confession.findByIdAndDelete(req.params.id);
            return res.json({ success: true, message: "Memory purged safely from ecosystem! 🗑️✨" });
        } else {
            return res.status(403).json({ success: false, message: "Security Warning: Unauthorized purge request." });
        }
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

app.listen(5000, () => console.log('🚀 Cupid System Core spinning on port 5000'));













