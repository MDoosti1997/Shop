const product = require('../models/product');
const Product = require('../models/product');
const mongoose = require('mongoose');
const {
    validationResult
} = require('express-validator');
const fileHelper = require('../util/file');

exports.getProducts = (req, res) => {

    Product.find({
        userId: req.user._id
    })
        .then(
            products => {
                res.render('admin/products', {
                    prods: products,
                    pageTitle: 'Admin Products',
                    path: '/admin/products',
                    isAuthenticated: req.session.isLoggedIn,
                });
            }
        ).catch(
            err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            }
        )

};

exports.getAddProduct = (req, res) => {
    res.render('admin/add-product', {
        path: '/admin/add-product',
        pageTitle: 'Add Product',
        editing: false,
        isAuthenticated: req.session.isLoggedIn,
        hasError: false,
        validationErrors: []

    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if (!image) {
        return res.render('admin/add-product', {
            path: '/admin/add-product',
            pageTitle: 'Add Product',
            editing: false,
            isAuthenticated: req.session.isLoggedIn,
            product: {
                title: title,
                imageUrl: image,
                price: price,
                description: description
            },
            errorMessage: "لطفا عکس وارد کنید",
            hasError: true,
            validationErrors: []
        });

    }


    if (!errors.isEmpty()) {



        return res.render('admin/add-product', {
            path: '/admin/add-product',
            pageTitle: 'Add Product',
            editing: false,
            isAuthenticated: req.session.isLoggedIn,
            product: {
                title: title,
                imageUrl: image,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            hasError: true,
            validationErrors: errors.array()
        });


    }







    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: image.path,
        userId: req.user
    });
    product.save()
        .then(result => {
            res.redirect('/');
        }).catch(err => {

            //     return res.render('admin/add-product', {
            //         path: '/admin/add-product',
            //         pageTitle: 'Add Product',
            //         editing: false,
            //         isAuthenticated: req.session.isLoggedIn,
            //         product: {
            //             title: title,
            //             imageUrl: imageUrl,
            //             price: price,
            //             description: description
            //         },
            //         errorMessage: 'عملیات ارتباط با دیتابیس با خطا مواجه شد لطفا به پشتیبانی اطلاع دهید تا مشکل را برطرف کند',
            //         hasError: true,
            //         validationErrors: []


            // });
            // res.redirect('/500');


            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);

        });

}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/');
    }

    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/add-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                isAuthenticated: req.session.isLoggedIn,
                hasError: false,
                validationErrors: [],
            });
        }).catch(
            err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            }
        );


}

exports.postEditProduct = (req, res) => {

    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const errors = validationResult(req);




    if (!errors.isEmpty()) {


        return res.render('admin/add-product', {
            path: '/admin/add-product',
            pageTitle: 'Add Product',
            editing: true,
            isAuthenticated: req.session.isLoggedIn,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            hasError: true
        }).catch(
            err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            }
        );


    }







    Product.findById(prodId)
        .then(product => {

            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.description = updatedDesc;
            return product.save().then(result => {
                console.log("Updated Product...");
                res.redirect('/');
            });;
        }).catch(err => {
            err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            }
        })

}

exports.deleteProduct = (req, res) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return next(new Error('product not found...'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({
                _id: prodId,
                userId: req.user._id
            });
        }).then(() => {
            console.log("Product Removed");
            res.json({ message: 'Successful' });
        }).catch(err => {
            res.json({ message: 'Delete product failed' });
        });
};