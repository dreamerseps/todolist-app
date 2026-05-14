'use strict';

const { Router }     = require('express');
const authController = require('./auth.controller');
const authenticate   = require('../../middlewares/authenticate');

const router = Router();

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/refresh',  authController.refresh);
router.post('/logout',   authenticate, authController.logout);

module.exports = router;
