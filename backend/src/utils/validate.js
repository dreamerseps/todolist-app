'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  if (typeof email !== 'string' || email === '') return false;
  return EMAIL_RE.test(email);
}

function isValidPassword(pw) {
  if (typeof pw !== 'string') return false;
  return pw.length >= 8;
}

function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

module.exports = { isValidEmail, isValidPassword, isRequired };
