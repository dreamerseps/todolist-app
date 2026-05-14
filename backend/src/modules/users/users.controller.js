'use strict';

const usersService = require('./users.service');

async function getMe(req, res, next) {
  try {
    const user = await usersService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await usersService.updateMe(req.user.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
