'use strict';

const { Router }      = require('express');
const usersController = require('./users.controller');
const authenticate    = require('../../middlewares/authenticate');

const router = Router();

router.use(authenticate);

router.get('/',  usersController.getMe);
router.patch('/', usersController.updateMe);

module.exports = router;
