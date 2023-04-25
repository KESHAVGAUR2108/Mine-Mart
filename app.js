const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
// const helmet = require("helmet");
// const compression = require("compression");
// const morgan = require("morgan");

const errorController = require("./controllers/errors");
const User = require("./models/user");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const csrf = require("csurf");
const flash = require("connect-flash");

const app = express();
app.set("view engine", "ejs");
app.set("views", "views");

const csrfProtection = csrf();

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "image/png" ||
		file.mimetype === "image/jpg" ||
		file.mimetype === "image/jpeg"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "images");
	},
	filename: (req, file, cb) => {
		cb(null, Date.now().toString() + file.originalname);
	},
});

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.nvhk4c5.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const store = new mongoDBStore({
	uri: MONGODB_URI,
	collection: "sessions",
});

// const activeLogStream = fs.createWriteStream(
// 	path.join(__dirname, "access.log"),
// 	{ flags: "a" }
// );

// app.use(helmet());
// app.use(compression());
// app.use(morgan("combined", { stream: activeLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
	multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
	session({
		secret: "my secret",
		resave: false,
		saveUninitialized: false,
		store: store,
	})
);

app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
	res.locals.isLoggedIn = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use((req, res, next) => {
	if (req.session.user) {
		User.findOne({ _id: req.session.user._id })
			.then((user) => {
				if (!user) {
					return next();
				}
				req.user = user;
				next();
			})
			.catch((err) => {
				next(new Error(err));
			});
	} else {
		next();
	}
});

app.use("/admin", adminRoutes);
app.use("/", shopRoutes);
app.use(authRoutes);

app.use(errorController.error404);

app.get("/500", errorController.error500);
app.use((error, req, res, next) => {
	res.status(500).render("500", {
		pageTitle: "Error",
		path: null,
		isAuthenticated: req.session.isLoggedIn,
	});
});

mongoose.connect(MONGODB_URI).then(() => {
	app.listen(process.env.PORT || 3000);
});

module.exports = app;