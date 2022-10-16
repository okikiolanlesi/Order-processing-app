const fs = require('fs');
// const path = require('path');
const Order = require('../models/orderModel.js');
const APIFeatures = require('../utils/APIFeatures.js');
const catchAsync = require('./../utils/catchAsync');
exports.getAllOrders = catchAsync(async (req, res, next) => {
  // authenticate(req, res, ['admin'])
  //   .then(() => res.status(200).send('Gotten an order'))
  //   .catch((err) => {
  //     res.status(401).json({
  //       status: 'fail',
  //       data: {
  //         message: err,
  //       },
  //     });
  //   });

  const features = new APIFeatures(Order, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const orders = await features.query;

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: { orders },
  });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError('No tour found With that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { order },
  });
});

// authenticate = (req, res, roles) => {
//   return new Promise((resolve, reject) => {
//     if (!req.body || !req.body.password || !req.body.username) {
//       reject('Username or password is invalid');
//     }
//     let user;
//     users.forEach((item) => {
//       item.username == req.body.username ? (user = item) : null;
//     });
//     if (!user) {
//       reject('Username or password is invalid');
//     }
//     if (!roles.includes(user.role)) {
//       reject('User does not have have access to this feature');
//     }
//     if (req.body.password === user.password && roles.includes(user.role)) {
//       resolve('User found');
//     } else {
//       reject('Passwords do not match');
//     }
//   });
// };

exports.updateOrder = catchAsync(async (req, res, next) => {
  const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedOrder) {
    return next(new AppError('No tour found With that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { updatedOrder },
  });
});
exports.createOrder = catchAsync(async (req, res, next) => {
  const createdOrder = await Order.create(req.body);
  res.status(200).json({
    status: 'success',
    data: { createdOrder },
  });
});
exports.deleteOrder = catchAsync(async (req, res, next) => {
  const deletedOrder = await Order.findByIdAndDelete(req.params.id);
  if (!deletedOrder) {
    return next(new AppError('No tour found With that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { deletedOrder },
  });
});
