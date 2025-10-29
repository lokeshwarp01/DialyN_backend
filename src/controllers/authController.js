// Authentication controller for admin and users (register/login)
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Create JWT token with role and id
function createToken(userId, role) {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}

// Admin register - this endpoint can be used once to create admin
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

        const existing = await Admin.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Admin already exists' });

        const admin = await Admin.create({ name, email, password });
        const token = createToken(admin._id, 'admin');
        res.json({ admin: { id: admin._id, name: admin.name, email: admin.email }, token });
        console.log(createToken)
    } catch (err) {
        console.error('registerAdmin', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin login
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = createToken(admin._id, 'admin');
        res.json({ admin: { id: admin._id, name: admin.name, email: admin.email }, token });
    } catch (err) {
        console.error('loginAdmin', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// User register
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password });
        const token = createToken(user._id, 'user');
        res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
    } catch (err) {
        console.error('registerUser', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// User login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = createToken(user._id, 'user');
        res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
    } catch (err) {
        console.error('loginUser', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
