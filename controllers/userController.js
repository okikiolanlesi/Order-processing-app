const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.updateUser = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }
  const { firstName, lastName, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstName,
      lastName,
      email,
    },
    {
      runValidators: true,
      new: true,
    }
  );
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }
  if (req.body.userType) {
    return next(newAppError('Cannot change user type', 400));
  }
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    runValidators: true,
    new: true,
  });
  if (!user) return next(new AppError('User not found', 404));
  console.log(user);
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
