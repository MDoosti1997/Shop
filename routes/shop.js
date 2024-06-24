const express = require("express");

const router = express.Router();


const shopController = require('../controllers/shop');
const isAuth = require("../middleware/is-auth");


router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.post('/cart', shopController.postCart);

router.get('/cart', shopController.getCart);

router.post('/cart-delete-item', shopController.postCartDeleteProduct);

router.get('/checkout', isAuth, shopController.getCheckout);

router.get('/PaymentRequest', isAuth, shopController.getPayment);

router.get('/checkPayment', isAuth, shopController.checkPayment);

router.post('/create-order', shopController.postOrder);

router.get('/orders', shopController.getOrder);

router.get('/invoices/:orderId', isAuth, shopController.getInvoices);

module.exports = router;