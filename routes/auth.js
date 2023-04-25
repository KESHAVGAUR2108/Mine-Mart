const express = require("express");
const { body } = require("express-validator");
const User = require("../models/user");

const router = express.Router();

const authController = require("../controllers/auth");

router.post("/updatePassword", authController.UpdatePassword);
router.get("/login", authController.getLogInPage);
router.post(
	"/login",
	body("email")
		.isEmail()
		.withMessage("Please enter a valid email address.")
		.custom((value, { req }) => {
			return User.findOne({ email: value }).then((userDoc) => {
				if (!userDoc) {
					return Promise.reject("No user found for entered E-mail");
				}
			});
		}),
	authController.postLogIn
);
router.get("/logout", authController.LogOut);
router.get("/signup", authController.getSignUp);
router.post(
	"/signup",
	[
		body("email")
			.isEmail()
			.withMessage("Please enter a valid email address.")
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then((userDoc) => {
					if (userDoc) {
						return Promise.reject(
							"Entered E-mail already exists, please pick a different one."
						);
					}
				});
			})
			.normalizeEmail(),
		body(
			"password",
			"Password must contains at least six characters and it must be alphaNumeric"
		)
			.isLength({ min: 6 })
			.isAlphanumeric()
			.trim(),
		body("confirmPassword")
			.trim()
			.custom((value, { req }) => {
				if (value != req.body.password) {
					throw new Error("Password does not match confirm password!");
				}
				return true;
			}),
	],
	authController.postSignUp
);
router.get("/reset", authController.getResetPage);
router.post("/reset", authController.postReset);
router.get("/reset/:token", authController.getNewPasswordPage);
module.exports = router;
