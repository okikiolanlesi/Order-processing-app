const fs = require('fs');
// const path = require('path');
const Order = require('../models/orderModel.js');
const APIFeatures = require('../utils/APIFeatures.js');

exports.getAllOrders = async (req, res) => {
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
  try {
    const features = new APIFeatures(Order, req.query);
    const orders = await features.filter().sort().limitFields().paginate();

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

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

exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({
      status: 'success',
      data: { updatedOrder },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.createOrder = async (req, res) => {
  try {
    const createdOrder = await Order.create(req.body);
    res.status(200).json({
      status: 'success',
      data: { createdOrder },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { deletedOrder },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
