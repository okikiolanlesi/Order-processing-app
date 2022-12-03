const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please tell us your first name!'],
    trim: true,
    maxlength: [
      20,
      'A user first name must have less than or equal to 40 characters',
    ],
  },
  lastName: {
    type: String,
    required: [true, 'Please tell us your last name!'],
    trim: true,
    maxlength: [
      20,
      'A user last name must have less than or equal to 40 characters',
    ],
  },
  email: {
    type: String,
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    required: [true, 'Please provide your email'],
  },
  photo: { type: String },
  password: {
    type: String,
    minlength: 8,
    required: [true, 'Please provide a password'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide passwordConfirm'],
    validate: {
      validator: function (el) {
        return this.password === el;
      },
      message: 'Password confirm must be equal to password',
      select: false,
    },
  },
  userType: {
    type: String,
    enum: ['user', 'admin', 'ceu', 'warehouse', 'logistics', 'sales'],
    default: 'user',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpiresIn: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password' || this.isNew)) return next();
  this.passwordChangedAt = Date.now() - 1000; // subtract 1 second to make sure the token is created before the password is changed;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.isCorrectPassword = async function (
  candidatePassword,
  password
) {
  return await bcrypt.compare(candidatePassword, password);
};
userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimeStamp > JWTTimestamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetTokenExpiresIn = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
