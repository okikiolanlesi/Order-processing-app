const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { promisify } = require('util');

const createSendToken = async (res, user, statusCode) => {
  const token = await jwt.sign(user.id, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: false,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  if (user.password) user.password = undefined;
  if (user.passwordConfirm) user.passwordConfirm = undefined;
  if (user.passwordChangedAt) user.passwordChangedAt = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, firstName, lastName } = req.body;
  const user = await User.create({
    email,
    password,
    passwordConfirm,
    firstName,
    lastName,
  });

  createSendToken(res, user, 201);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Invalid details', 401));
  const passwordCheck = await user.isCorrectPassword(password, user.password);
  if (!passwordCheck) return next(new AppError('Invalid details', 401));
  createSendToken(res, user, 200);
});
exports.protect = catchAsync(async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return next(new AppError('Please login', 401));
  }
  const token = req.headers.authorization.split(' ')[1];

  const decodedData = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  //   if (!decodedData) return next(new AppError('Invalid data', 401));
  const user = await User.findById(decodedData.id);
  if (!user) return next(new AppError('Please login', 401));
  if (!user.changedPasswordAfter(decodedData.iat)) {
    return next(
      new AppError('Recently changed password! Please login again', 401)
    );
  }
  req.user = user;
  next();
});
exports.restrictTo = (...roles) => {
  catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.userType))
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    next();
  });
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user found with that email', 404));
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(res, user, 200);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('No user found with that email', 404));
  const passwordCheck = await user.isCorrectPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!passwordCheck) return next(new AppError('Invalid details', 401));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendToken(res, user, 200);
});
