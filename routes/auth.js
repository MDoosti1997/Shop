const express = require("express");
const {
    check,
    body
} = require("express-validator");

const router = express.Router();

const authController = require('../controllers/auth');


router.get('/login', authController.getLogin);



router.post('/login', [
    check('email')
    .isEmail()
    .withMessage('لطفا یک ایمیل معتبر وارد کنید')
    .normalizeEmail(),
    check('password', 'لطفا یک رمز عبور معتبر وارد کنید')
    .isLength({
        min: 5,
        max: 25
    })
    .isAlphanumeric()
    .trim()

], authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup',
    [check('email')
        .isEmail()
        .withMessage('لطفا یک ایمیل معتبر وارد کنید')
        .custom((value, {
            req
        }) => {

            if (value === 'test@gmail.com') {
                throw new Error('شما حق ورود به وبسایت مارا ندارید ');
            }

            return true;

        })
        .normalizeEmail()
        .trim(),
        body('password', 'لطفا رمز عبور خود را با تعداد بیشتر از 5 کاراکتر و ترکیبی از اعداد و حروف تنظیم کنید')
        .isLength({
            min: 5
        }).trim()
        .isAlphanumeric(),
        body('confimPassword').custom((value, {
            req
        }) => {
            if (value !== req.body.password) {
                throw new Error('تکرار رمز عبور با رمز عبور همخوانی ندارد')
            }
            return true;
        }).trim()

    ]



    , authController.postSignup);


router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getResetPassword);


router.post('/new-password', authController.postNewPassword);


module.exports = router;