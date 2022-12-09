const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post(
  '/signup',
  authController.protect,
  authController.restrictTo('admin'),
  authController.signup
);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router
  .route('/updateMe')
  .patch(authController.protect, userController.updateMe);
router
  .route('/updatePassword')
  .patch(authController.protect, authController.updatePassword);
router
  .route('/deleteMe')
  .delete(authController.protect, userController.deleteMe);

module.exports = router;
