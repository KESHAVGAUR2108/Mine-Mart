const express = require("express");
const { body } = require("express-validator");

const router = express.Router();
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

router.get("/edit-product", isAuth, adminController.getAddProductPage);
router.post(
	"/edit-product/:id",
	[
		body("title", "Title must be atleast 5 characters long.")
			.trim()
			.isLength({ min: 5 }),
		body("price").isFloat(),
		body("description", "Description can not exceed 400 words")
			.trim()
			.isLength({ max: 400 }),
	],
	isAuth,
	adminController.postEditProduct
);
router.post(
	"/add-product",
	[
		body("title", "Title must be atleast 5 characters long.")
			.trim()
			.isLength({ min: 5 }),
		body("price").isFloat(),
		body("description", "Description can not exceed 400 words")
			.trim()
			.isLength({ max: 400 }),
	],
	isAuth,
	adminController.postAddProduct
);

router.get("/edit-product/:id", isAuth, adminController.getEditProduct);
router.delete("/delete/:productId", isAuth, adminController.DeleteProduct);
router.get("/product-list", isAuth, adminController.getAdminProductList);

module.exports = router;
