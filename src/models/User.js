// User model for regular users (viewers)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profile: {
            bio: { type: String, default: '' },
            avatar: {
                url: { type: String, default: '' },
                public_id: { type: String, default: '' }
            },
            location: { type: String, default: '' },
            website: { type: String, default: '' }
        },
        preferences: {
            subscribeToNewsletter: { type: Boolean, default: false },
            emailNotifications: { type: Boolean, default: true },
            topics: [{ type: String }]  // For topic-based subscriptions
        },
        lastLogin: { type: Date },
        isVerified: { type: Boolean, default: false }
    },
    { 
        timestamps: true,
        toJSON: {
            transform: function(doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare provided password with stored hashed password
UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
