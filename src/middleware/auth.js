// Authentication middleware for admin and user routes
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Verify token and attach user/admin to request depending on type
function auth(requiredRole = 'any') {
    return async (req, res, next) => {
        try {
            const header = req.headers.authorization;
            if (!header || !header.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authorization token missing' });
            }

            const token = header.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Token may contain role and id
            if (decoded.role === 'admin') {
                const admin = await Admin.findById(decoded.id).select('-password');
                if (!admin) return res.status(401).json({ message: 'Invalid admin token' });
                req.admin = admin;
                if (requiredRole === 'user') return res.status(403).json({ message: 'Admin not allowed' });
            } else if (decoded.role === 'user') {
                const user = await User.findById(decoded.id).select('-password');
                if (!user) return res.status(401).json({ message: 'Invalid user token' });
                req.user = user;
                if (requiredRole === 'admin') return res.status(403).json({ message: 'User not allowed' });
            } else {
                return res.status(401).json({ message: 'Invalid token role' });
            }

            next();
        } catch (err) {
            console.error('Auth middleware error', err.message);
            return res.status(401).json({ message: 'Authentication failed', error: err.message });
        }
    };
}

module.exports = auth;
