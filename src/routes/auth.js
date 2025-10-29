const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

// Admin auth
router.post('/admin/register', authCtrl.registerAdmin); // create admin (use once)
router.post('/admin/login', authCtrl.loginAdmin);

// User auth
router.post('/user/register', authCtrl.registerUser);
router.post('/user/login', authCtrl.loginUser);

module.exports = router;




