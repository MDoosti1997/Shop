const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
require('dotenv').config();

const errorController = require('./controllers/error')


let port = process.env.PORT || 3001;
let host = process.env.HOST;
let databaseName = process.env.DATABASE_NAME;
let databaseHost = process.env.DATABASE_HOST;




const User = require('./models/user');

const MONGODB_URL = `mongodb://${databaseHost}/${databaseName}`;

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URL,
    collection: 'session'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toDateString() + "_" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {

    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'application/pdf'
    ) {

        cb(null, true);

    } else {
        cb(null, false);
    }

}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRouter = require('./routes/admin');
const shopRouter = require('./routes/shop');
const authRouter = require('./routes/auth');



app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use("/images", express.static(path.join(__dirname, 'images')));
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(csrfProtection);
app.use(flash());



app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});


app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        }).catch(err => {
            throw new Error(err);
        })
});

app.use((error, req, res, next) => {
    // res.status(error.httpstatuscode)
    return res.status(500).render('500', {
        pageTitle: 'Error',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    })
});



app.use('/admin', adminRouter);
app.use(shopRouter);
app.use(authRouter);


app.get('/500', errorController.get500);







mongoose.connect(MONGODB_URL)
    .then(result => {
        app.listen(port, () => {
            console.log("URL :" + `http://${host}:${port}/`);
        });
    })
    .catch(
        err => {
            console.log(err);
        }
    )