'use strict';

const { Router }          = require('express');
const categoriesController = require('./categories.controller');
const authenticate         = require('../../middlewares/authenticate');

const router = Router();

router.use(authenticate);

router.get('/',     categoriesController.getAll);
router.post('/',    categoriesController.create);
router.patch('/:id', categoriesController.update);
router.delete('/:id', categoriesController.remove);

module.exports = router;
