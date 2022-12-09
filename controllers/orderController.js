const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const Order = require('../models/orderModel');
const APIFeatures = require('../utils/APIFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 1024 * 1024 },
});

exports.uploadImages = upload.array('images', 50);

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Order, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const orders = await features.query.populate({
    path: 'user',
    select: 'firstName lastName email',
  });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: { orders },
  });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate({
    path: 'user',
    select: '-passwordChangedAt -__v',
  });
  if (!order) {
    return next(new AppError('No tour found With that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { order },
  });
});

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

exports.uploadPhotoToCloudinary = catchAsync(async (req, res, next) => {
  if (!req.files) return next();
  const images = [];

  const uploadStream = (file) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'orderImages',
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          if (result) {
            images.push(result.secure_url);
            resolve(result);
          }
        }
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });

  await Promise.all(
    await req.files.map(async (file) => await uploadStream(file))
  );
  req.body.images = images;
  next();
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const {
    customerName,
    orderType,
    phoneNumber,
    orderContent,
    address,
    paid,
    extraContent,
    images,
  } = req.body;
  const order = {};
  if (customerName) order.customerName = customerName;
  if (orderType) order.orderType = orderType;
  if (phoneNumber) order.phoneNumber = phoneNumber;
  if (orderContent) order.orderContent = orderContent;
  if (address) order.address = address;
  if (paid) order.paid = paid;
  if (extraContent) order.extraContent = extraContent;
  if (images) order.images = images;
  order.user = req.user.id;
  const createdOrder = await Order.create(order);
  if (!createdOrder) {
    return next(new AppError('Unable to create order, try again later', 404));
  }
  res.status(201).json({
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

exports.checkIfUserCreatedOrder = catchAsync(async (req, res, next) => {
  if (req.user.id === req.order.user.id) {
    next();
  } else {
    return next(new AppError('You do not have access to this order', 401));
  }
});
