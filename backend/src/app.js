'use strict';

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const swaggerUi    = require('swagger-ui-express');
const swaggerDoc   = require(path.resolve(__dirname, '../../swagger/swagger.json'));
const errorHandler = require('./middlewares/errorHandler');
const { NotFoundError } = require('./utils/errors');
const authRouter        = require('./modules/auth/auth.router');
const usersRouter       = require('./modules/users/users.router');
const categoriesRouter  = require('./modules/categories/categories.router');
const todosRouter       = require('./modules/todos/todos.router');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: false,
}));

app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use('/api/auth',        authRouter);
app.use('/api/users/me',   usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/todos',      todosRouter);

app.get('/health', async (_req, res) => {
  try {
    const { checkConnection } = require('./config/database');
    await checkConnection();
    res.json({ success: true, status: 'ok' });
  } catch {
    res.status(503).json({ success: false, status: 'db_error' });
  }
});

// 404 — 등록되지 않은 경로
app.use((_req, _res, next) => {
  next(new NotFoundError('요청한 경로를 찾을 수 없습니다'));
});

app.use(errorHandler);

module.exports = app;
