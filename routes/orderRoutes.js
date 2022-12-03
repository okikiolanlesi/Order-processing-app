const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);
router
  .route('/')
  .get(orderController.getAllOrders)
  .post(
    authController.restrictTo('sales', 'admin'),
    orderController.uploadImages,
    orderController.uploadPhotoToCloudinary,
    orderController.createOrder
  );

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(orderController.checkIfUserCreatedOrder, orderController.updateOrder)
  .delete(orderController.checkIfUserCreatedOrder, orderController.deleteOrder);

module.exports = router;
