const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");

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

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "images");
	},
	filename: (req, file, cb) => {
		cb(null, Date.now().toString() + file.originalname);
	},
});

const MONGODB_URI =
	"mongodb+srv://keshavgaur679:4sHjzKcutf9EpZ08@cluster0.nvhk4c5.mongodb.net/mine-mart-Mongoose";
// console.log(process.env.MONGO_USER);
// console.log(process.env.MONGO_PASSWORD);
// console.log(process.env.MONGO_DEFAULT_DATABASE);
// const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.nvhk4c5.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}&authSource=admin`;

const store = new mongoDBStore({
	uri: MONGODB_URI,
	collection: "sessions",
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage }).single("image"));
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
	app.listen(3000);
});

module.exports = app;
