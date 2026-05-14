'use strict';

const { Router }      = require('express');
const todosController = require('./todos.controller');
const authenticate    = require('../../middlewares/authenticate');

const router = Router();

router.use(authenticate);

router.get('/',      todosController.getAll);
router.post('/',     todosController.create);
router.get('/:id',   todosController.getById);
router.patch('/:id', todosController.update);
router.delete('/:id', todosController.remove);

module.exports = router;
