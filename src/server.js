// Entry point for the API server
// Loads environment, connects to MongoDB and starts Express app
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

// Load env from .env file
dotenv.config();

const app = express();

// Built-in middleware for JSON body parsing with increased limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Enable CORS so the admin HTML (served via file:// or another origin) can call the API
app.use(cors());

// NOTE: we intentionally do NOT enable URL-encoded/form parsing here to enforce
// JSON-only payloads across the API. File uploads (if needed) should be sent as
// base64 inside JSON or handled by a dedicated upload endpoint.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Basic health route
app.get('/', (req, res) => {
    res.json({ ok: true, message: 'DailyNews API is running' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dailynews';

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });
