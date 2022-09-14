const express = require('express');
const morgan = require('morgan');
const orderRouter = require('./routes/orderRoutes');

//MIDDLEWARES
const app = express();
app.use(express.json());
app.use(morgan('dev'));

//ROUTES
app.use('/api/v1/orders', orderRouter);

module.exports = app;
