const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Order must have a name'] },
  phoneNumber: {
    type: Number,
    required: [true, 'Order must have a phone number'],
  },
  state: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    required: [true, 'Order must have a state'],
  },
  orderType: { type: String, required: [true, 'Order must have a order type'] },
  address: { type: String, required: [true, 'Order must have an address'] },
  orderContent: [{ type: String, required: [true, 'Order must have content'] }],
  paymentStatus: {
    type: String,
    required: [true, 'Order must have payment status'],
  },
  extraContent: [String],
  images: [String],
  createdAt: { type: Date, default: Date.now() },
});

const Order = new mongoose.model('Order', orderSchema);

module.exports = Order;
