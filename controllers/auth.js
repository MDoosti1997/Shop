const bcrypt = require('bcryptjs');
const User = require('../models/user');
const sendEmail = require('../util/email');
const crypto = require('crypto');
const {
    validationResult
} = require('express-validator');



exports.getLogin = (req, res) => {

    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/login', {
        path: '/Login',
        pageTitle: 'ورود',
        errorMessage: message,
        successMessage: req.flash('success')
    });
}

exports.postLogin = (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);


    if(!errors.isEmpty()){

        return res.render('auth/login',{
            path: '/Login',
            pageTitle: 'ورود',
            errorMessage: errors.array()[0].msg,
            successMessage: req.flash('success')

        })


    }








    User.findOne({
        email: email
    }).then(
        user => {
            if (!user) {
                req.flash('error', 'ایمیل شما اشتباه است!');
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password).then(isMatch => {

                if (isMatch) {
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    return req.session.save(err => {
                        console.log(err);
                        res.redirect('/');
                    });
                }
                req.flash('error', 'پسورد شما اشتباه است !');
                res.redirect('/login');
            })

        }
    )
}

exports.postLogout = (req, res) => {

    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    })
}

exports.getSignup = (req, res) => {
    res.render('auth/singup', {
        path: '/singup',
        pageTitle: 'ثبت نام',
        errorMessage: req.flash('error')[0],
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: [] // اضافه کردن validationErrors به ویو
    });
};


exports.postSignup = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confimPassword;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        console.log(errors.array());

        return res.status(422).render('auth/singup', {
            path: '/singup',
            pageTitle: 'ثبت نام',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        });

    }

    User.findOne({
            email: email
        })
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'ایمیلی با همین نام در سایت ثبت نام کرده است . لطفا با ایمیل دیگری ثبت نام کنید')
                return res.redirect('/signup');
            }
            return bcrypt
                .hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: {
                            items: []
                        }
                    });
                    return user.save();
                })
                .then(result => {
                    req.flash('success', 'ثبت نام شما با موفقیت انجام شد میتوانید وارد شوید');
                    sendEmail({
                        subject: 'ثبت نام',
                        text: 'ثبت نام شما با موفقیت انجام شد میتوانید وارد شوید',
                        userEmail: email
                    });
                    res.redirect('/login');

                })
        })
        .catch(err => {
            err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            } 
        });

}

exports.getReset = (req, res) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'بازیابی رمز عبور',
        errorMessage: message
    })


}

exports.postReset = (req, res) => {

    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({
                email: req.body.email
            })
            .then(user => {
                if (!user) {
                    req.flash('error', 'کاربری با این ایمیل یافت نشد لطفا ایمیل دیگری را امتحان کنید!');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.ExpiredDateresetToken = Date.now() + 3600000;
                return user.save();

            }).then(
                result => {
                    res.redirect('/');
                    sendEmail({
                        userEmail: req.body.email,
                        subject: 'بازیابی رمز عبور',
                        html: `<p>درخواست بازیابی رمز عبوز</p>
                    <p>برای بازیابی رمز عبور <a href="http://localhost:3001/reset/${token}" >این لینک را</a> کلیک کنید </p>
                    `
                    });
                }
            ).catch(err => {
                console.log(err);
            });
    });
};

exports.getResetPassword = (req, res) => {

    const token = req.params.token;
    User.findOne({
        resetToken: token,
        ExpiredDateresetToken: {
            $gt: Date.now()
        }
    }).then(user => {

        console.log(user);

        let message = req.flash('error');
        if (message.length > 0) {
            message = message[0];
        } else {
            message = null;
        }
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'رمز عبور جدید',
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        })

    }).catch(err => {
        console.log(err);
    })



}


exports.postNewPassword = (req, res) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        ExpiredDateresetToken: {
            $gt: Date.now()
        },
        _id: userId

    }).then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
    }).then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.ExpiredDateresetToken = undefined;
        return resetUser.save();
    }).then(result => {
        console.log(result);
        res.redirect('/login');
    }).catch(
        err => {
            console.log(err);
        }
    );




}