const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (res, user, statusCode, req) => {
  const token = signToken(user._id);
  const cookieOptions = {
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    // httpOnly: true means that the cookie cannot be accessed or modified in any way by the browser
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  };
  if (req.secure || req.headers['x-forwarded-proto'] === 'https')
    cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.passwordChangedAt = undefined;
  user.passwordResetToken = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const { email, password, passwordConfirm, firstName,photo, lastName, userType } = req.body;

  const user = await User.create(req.body);

  createSendToken(res, user, 201, req);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Invalid details', 401));
  const passwordCheck = await user.isCorrectPassword(password, user.password);
  if (!passwordCheck) return next(new AppError('Invalid details', 401));

  createSendToken(res, user, 200, req);
});
exports.protect = catchAsync(async (req, res, next) => {
  // Get token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  // 2. Verify token
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
  // 3. save user to req.user
  req.user = user;
  next();
});

exports.restrictTo = (...types) =>
  catchAsync(async (req, res, next) => {
    if (!types.includes(req.user.userType)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  });

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user found with that email', 404));
  const resetToken = await user.createPasswordResetToken();
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
  user.passwordResetTokenExpiresIn = undefined;
  await user.save();
  createSendToken(res, user, 200, req);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  if (
    !req.body.password ||
    !req.body.passwordConfirm ||
    !req.body.currentPassword
  ) {
    return next(new AppError('Please provide a password and password confirm'));
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('No user found with that email', 404));
  const passwordCheck = await user.isCorrectPassword(
    req.body.currentPassword,
    user.password
  );
  if (!passwordCheck) return next(new AppError('Invalid details', 401));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  user.password = undefined;
  user.passwordConfirm = undefined;

  createSendToken(res, user, 200, req);
});
// exports.updatePassword = catchAsync(async (req, res, next) => {
//   if (
//     !req.body.password ||
//     !req.body.passwordConfirm ||
//     !req.body.currentPassword
//   ) {
//     return next(new AppError('Please provide a password and password confirm'));
//   }
//   const { currentPassword, newPassword, newPasswordConfirm } = req.body;

//   // 1) Get user from collection
//   const user = await User.findById(req.user._id).select('+password');

//   // 2) Check if POSTed current password is correct
//   if (!(await user.isCorrectPassword(currentPassword, user.password))) {
//     return next(new AppError('Your current password is wrong.', 401));
//   }
//   // 3) If so, update password
//   user.password = newPassword;
//   user.passwordConfirm = newPasswordConfirm;
//   // User.findByIdAndUpdate will NOT work as intended! so we use .save
//   await user.save();

//   // Remove password and passwordConfirm from output
//   user.password = undefined;
//   user.passwordConfirm = undefined;

//   createSendToken(res, user, 200, req);
// });
