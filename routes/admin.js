const express = require("express");

const {
    check,
    body
} = require("express-validator");

const router = express.Router();

const isAuth = require('../middleware/is-auth');

const adminController = require('../controllers/admin');


router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/add-product', [
    body('title', 'لطفا یک نام معتبر وارد کنید').isString()
        .isLength({
            min: 3
        })
        .trim(),
    body('price', 'لطفا قیمت را به درستی وارد کنید').isFloat(),
    body('description', 'لطفا توضیحات را به درستی وارد کنید').isLength({
        min: 5,
        max: 500
    })
        .trim()
], isAuth, adminController.postAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title', 'لطفا یک نام معتبر وارد کنید').isString()
        .isLength({
            min: 3
        })
        .trim(),
    body('price', 'لطفا قیمت را به درستی وارد کنید').isFloat(),
    body('description', 'لطفا توضیحات را به درستی وارد کنید').isLength({
        min: 5,
        max: 500
    })
        .trim()
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;