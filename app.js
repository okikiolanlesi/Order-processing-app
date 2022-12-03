const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const orderRouter = require('./routes/orderRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
//MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Sets security HTTP headers
app.use(helmet());
app.use(cookieParser());
// Limits request per IP address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

// Parses the body of the request into json and limit the size/space of the body
app.use(express.json({ limit: '40kb' }));
app.use(express.urlencoded({ extended: true, limit: '40kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS(Cross-site scripting) like injecting html/javascript code into the body
app.use(xss());

// Prevents parameter pollution by removing duplicate query parameters
// HPP stands for HTTP Parameter Pollution
// Also whitelists some parameters that are allowed to be duplicated
app.use(
  hpp({
    whitelist: [
      'phoneNumber',
      'state',
      'orderType',
      'orderContent',
      'paymentStatus',
      'createdAt',
    ],
  })
);
app.use(compression());
//ROUTES
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const message = `Route not found`;
  next(new AppError(message, 404));
});

app.use(globalErrorHandler);

module.exports = app;
