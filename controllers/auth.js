const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

const User = require("../models/user");

let transporter = nodemailer.createTransport({
	service: "gmail",
	secure: true,
	auth: {
		user: "keshavgaur5455@gmail.com",
		pass: "ppedsbwfrhzosjwi",
	},
	tls: { rejectUnauthorized: false },
});

exports.getLogInPage = (req, res, next) => {
	// 	req.get("Cookie").split(";")[2].trim().split("=")[1] === "true";
	let successMsg = req.flash("success");
	if (successMsg.length === 0) {
		successMsg = null;
	}

	return res.render("auth/login", {
		pageTitle: "Log In",
		path: "/login",
		error: req.flash("error"),
		success: successMsg,
		oldInput: {
			email: "",
			password: "",
		},
		errorParam: "",
	});
};

exports.postLogIn = (req, res, next) => {
	// res.setHeader("set-Cookie", "loggedIn=true");

	const { email, password } = req.body;
	const { errors } = validationResult(req);

	if (errors.length > 0) {
		return res.status(442).render("auth/login", {
			pageTitle: "Log In",
			path: "/login",
			error: errors[0].msg,
			oldInput: {
				email: email,
				password: password,
			},
			errorParam: errors[0].param,
		});
	}

	User.findOne({ email: email })
		.then((user) => {
			bcrypt
				.compare(password, user.password)
				.then((result) => {
					if (result) {
						req.session.isLoggedIn = true;
						req.session.user = user;
						return req.session.save((err) => {
							if (err) {
								console.log(err);
							}
							res.redirect("/");
						});
					} else {
						return res.status(442).render("auth/login", {
							pageTitle: "login",
							path: "/login",
							error: "Incorrect password!.",
							oldInput: {
								email: email,
								password: password,
							},
							errorParam: "password",
						});
					}
				})
				.catch((err) => {
					if (err) {
						console.log(err);
						req.flash("error", err);
					}
					res.redirect("/login");
				});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.LogOut = (req, res, next) => {
	req.session.destroy((err) => {
		if (err) {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		} else {
			req.session = undefined;
			res.redirect("/");
			res.end();
		}
	});
};

exports.getSignUp = (req, res, next) => {
	res.render("auth/signup", {
		pageTitle: "SignUp",
		path: "/signup",
		error: req.flash("error"),
		oldInput: { email: "", password: "", confirmPassword: "" },
		errorParam: "",
	});
};

exports.postSignUp = (req, res, next) => {
	const { email, password, confirmPassword } = req.body;
	const { errors } = validationResult(req);
	if (errors.length > 0) {
		return res.status(422).render("auth/signup", {
			pageTitle: "SignUp",
			path: "/signup",
			error: errors[0].msg,
			oldInput: {
				email: email,
				password: password,
				confirmPassword: confirmPassword,
			},
			errorParam: errors[0].param,
		});
	}

	return bcrypt
		.hash(password, 12)
		.then((hashPassword) => {
			const user = new User({
				email: email,
				password: hashPassword,
				cart: { items: [] },
			});
			return user.save();
		})
		.then(() => {
			req.flash("success", "Successfully signedUp");

			return transporter.sendMail({
				from: "keshavgaur679@gmail.com",
				to: email,
				subject: "Confirmation",
				html: "<h1>You are successfully signed up on mine-mart.<h1>",
			});
		})
		.then(() => {
			console.log("Confirmation mail delivered");
			return res.redirect("/login");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getResetPage = (req, res, next) => {
	let successMsg = req.flash("success");
	if (successMsg.length === 0) {
		successMsg = null;
	}
	res.render("auth/reset", {
		pageTitle: "Reset Password",
		path: "/reset",
		error: req.flash("error"),
		success: successMsg,
	});
};

exports.postReset = (req, res, next) => {
	const email = req.body.email;
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			return res.redirect("/reset");
		}

		const token = buffer.toString("hex");

		User.findOne({ email: email })
			.then((user) => {
				if (!user) {
					req.flash("error", "No user exist with the entered email!");
					return res.redirect("/reset");
				}

				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 3600000;
				return user.save();
			})
			.then(() => {
				transporter
					.sendMail({
						from: "keshavgaur679@gmail.com",
						to: email,
						subject: "Reset Password",
						html: `<h2>You requested password reset.</h2><h4>If the request is made by you then <a href='https://mine-mart.onrender.com/reset/${token}'>click Here</a> to reset password.`,
					})
					.then(() => {
						console.log("Password reset confirmation mail is delivered.");
						req.flash(
							"success",
							"We have sent a confirmation mail on your gmail."
						);
						return res.redirect("/reset");
					})
					.catch((err) => console.log(err));
			})
			.catch((err) => {
				const error = new Error(err);
				error.httpStatusCode = 500;
				return next(error);
			});
	});
};

exports.getNewPasswordPage = (req, res, next) => {
	const token = req.params.token;

	User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
		.then((user) => {
			res.render("auth/updatePassword", {
				pageTitle: "New Password",
				error: req.flash("error"),
				path: "/updatePassword",
				userId: user._id.toString(),
				passwordToken: token,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.UpdatePassword = (req, res, next) => {
	const token = req.body.passwordToken;
	const userId = req.body.userId;

	User.findOne({
		resetToken: token,
		resetTokenExpiration: { $gt: Date.now() },
		_id: userId,
	})
		.then((user) => {
			if (!user) {
				req.flash("error", "Password update time expired!\nPlease try again.");
				return res.redirect(`/reset/${token}`);
			}
			if (req.body.password != req.body.confirmPassword) {
				req.flash("error", "Password does not match confirm password!");
				return res.redirect(`/reset/${token}`);
			}

			bcrypt
				.hash(req.body.password, 12)
				.then((hashedPassword) => {
					user.password = hashedPassword;
					user.resetToken = undefined;
					user.resetTokenExpiration = undefined;
					return user.save();
				})
				.then(() => {
					req.flash("success", "Password updated Successfully!.");
					res.redirect("/login");
				})
				.catch((err) => console.log(err));
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
