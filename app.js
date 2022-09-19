const express = require('express');
const morgan = require('morgan');
const orderRouter = require('./routes/orderRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

//MIDDLEWARES
const app = express();
app.use(express.json());
app.use(morgan('dev'));

//ROUTES
app.use('/api/v1/orders', orderRouter);

app.all('*', (req, res, next) => {
  const message = `Route not found`;
  next(new AppError(message, 404));
});

app.use(globalErrorHandler);

module.exports = app;
