const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Order must have a customerName'],
    },
    phoneNumber: {
      type: Number,
    },
    state: {
      type: String,
      enum: ['pending', 'processed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      required: [true, 'Order must have a state'],
    },
    orderType: {
      type: String,
      enum: ['pickup', 'offline', 'online'],
      required: [true, 'Order must have a order type'],
    },
    address: { type: String, required: [true, 'Order must have an address'] },
    orderContent: [
      { type: String, required: [true, 'Order must have content'] },
    ],
    paid: {
      type: Boolean,
      required: [true, 'Order must have payment status'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    extraContent: [String],
    images: [String],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const Order = new mongoose.model('Order', orderSchema);

module.exports = Order;
