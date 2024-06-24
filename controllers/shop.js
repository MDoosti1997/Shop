const Product = require("../models/product");
const Order = require("../models/order");
const cookieParse = require("../util/cookieparser");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const ZarinpalCheckout = require('zarinpal-checkout');
const { response } = require("express");
const ITEMS_PER_PAGE = 3;


var zarinpal = ZarinpalCheckout.create
  ('xxxxxxxx-0048-11e8-94db-005056a205be', true);


exports.getProducts = (req, res) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .count()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        path: "/",
        pageTitle: "Shop",
        prods: products,
        isAuthenticated: req.session.isLoggedIn,
        csrfToken: req.csrfToken(),
        currentPage: page,
        totalProducts: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getIndex = (req, res) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .count()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        path: "/",
        pageTitle: "Shop",
        prods: products,
        isAuthenticated: req.session.isLoggedIn,
        csrfToken: req.csrfToken(),
        currentPage: page,
        totalProducts: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getProduct = (req, res) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-details", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.postCart = (req, res) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then((product) => {
    req.user.addTocart(product);
    res.redirect("/cart");
  });
};
exports.getCart = async (req, res) => {
  const user = await req.user.populate("cart.items.productId");
  res.render("shop/cart", {
    pageTitle: "Cart",
    path: "/cart",
    products: user.cart.items,
    isAuthenticated: req.session.isLoggedIn,
  });
};
exports.postCartDeleteProduct = (req, res) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.postOrder = (req, res) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          product: {
            ...i.productId._doc,
          },
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getCheckout = async (req, res) => {

  const user = await req.user.populate("cart.items.productId");
  const products = user.cart.items;

  let totalPrice = 0;
  products.forEach(p => {
    totalPrice += p.quantity * p.productId.price;
  });

  res.render("shop/checkout", {
    pageTitle: "checkout",
    path: "/checkout",
    products: user.cart.items,
    isAuthenticated: req.session.isLoggedIn,
    totalSum: totalPrice
  });
};
exports.getOrder = (req, res) => {
  Order.find({
    "user.userId": req.user._id,
  })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
        refid: req.flash('refid')[0]
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getPayment = async (req, res) => {

  const user = await req.user.populate("cart.items.productId");
  const products = user.cart.items;

  let totalPrice = 0;
  products.forEach(p => {
    totalPrice += p.quantity * p.productId.price;
  });

  zarinpal.PaymentRequest({
    Amount: totalPrice,
    CallbackURL: 'http://localhost:3001/checkPayment',
    Description: 'تست اتصال به درگاه پرداخت',
    Email: user.email,
    Mobile: '0913000000'
  }).then(response => {
    console.log(response);
    res.redirect(response.url);
  }).catch(err => {
    console.log(err);
  });

}
exports.checkPayment = async (req, res) => {  // این تابع وضعیت پرداخت را با استفاده از درگاه پرداخت زرین‌پال بررسی می‌کند

  const user = await req.user.populate("cart.items.productId");   // اطلاعات محصولات موجود در سبد خرید کاربر را با جزئیات محصولات بارگیری می‌کند
  const products = user.cart.items;

  let totalPrice = 0;   // مجموع قیمت محصولات موجود در سبد را محاسبه می‌کند
  products.forEach((p) => {
    totalPrice += p.quantity * p.productId.price;
  });

  const authority = req.query.Authority;

  const status = req.query.Status;

  if (status == 'OK') {

    zarinpal
      .PaymentVerification({
        Amount: totalPrice,
        Authority: authority,
      })
      .then((response) => {
        console.log(response);
        if (response.status === 100) {
          console.log('Verified' + response.RefID);


          req.user
            .populate("cart.items.productId")
            .then((user) => {
              const products = user.cart.items.map((i) => {
                return {
                  quantity: i.quantity,
                  product: {
                    ...i.productId._doc,
                  },
                };
              });
              const order = new Order({           // سفارش جدید را ایجاد کرده و در پایگاه داده ذخیره می‌کند
                user: {
                  email: req.user.email,
                  userId: req.user,
                },
                products: products,
              });
              return order.save();
            })
            .then(() => {          // پس از ایجاد سفارش، سبد خرید کاربر را خالی می‌کند
              return req.user.clearCart();
            })
            .then(() => {
              req.flash('refid', response.RefID);
              res.redirect("/orders");           // کاربر را به صفحه سفارش‌ها هدایت می‌کند
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
  } else if (status == 'NOK') {
    res.redirect('/cart');
  }

};
exports.getInvoices = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No Order Found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("unauthorized"));
      }

      const invoiceName = "invoices-" + orderId + ".pdf";
      const invoicePath = path.join("files", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="' + invoiceName + '"'
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("فاکتور", {
        underline: true,
      });

      pdfDoc.fontSize(14).text("------------------------------");

      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.text(prod.quantity + " x " + prod.product.price + " Rial ");
      });

      pdfDoc.text("Total Price :" + totalPrice);

      pdfDoc.end();

      // fs.readFile(invoicePath, (err, data) => {

      //     if (err) {
      //         return next(err);
      //     }

      //     res.setHeader('Content-Type', 'application/pdf');

      //     res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');

      //     res.send(data);

      // })

      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch((err) => next(err));
};
