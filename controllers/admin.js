const mongoose = require("mongoose");

const Product = require("../models/product");
const Order = require("../models/order");
const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");

exports.getAddProductPage = (req, res, next) => {
	res.render("admin/edit-product", {
		pageTitle: "M-Mart | Add Product",
		path: "/admin/add-product",
		editing: false,
		oldInput: {
			title: "",
			imageUrl: "",
			price: null,
			description: "",
		},
		error: [],
		errorParam: null,
	});
};

exports.postAddProduct = (req, res, next) => {
	let { title, price, description } = req.body;
	const image = req.file;
	const { errors } = validationResult(req);

	if (!image) {
		return res.status(422).render("admin/edit-product", {
			pageTitle: "M-Mart | Add Product",
			path: "/admin/add-product",
			editing: false,
			oldInput: {
				title: title,
				price: price,
				description: description,
			},
			error: "Image should be in jpg/jpeg/png format.",
			errorParam: null,
		});
	}

	if (errors.length > 0) {
		return res.status(422).render("admin/edit-product", {
			pageTitle: "M-Mart | Add Product",
			path: "/admin/add-product",
			editing: false,
			oldInput: {
				title: title,
				imageUrl: image,
				price: price,
				description: description,
			},
			error: errors[0].msg,
			errorParam: errors[0].param,
		});
	}

	const imageUrl = image.path;

	const product = new Product({
		title: title,
		imageUrl: imageUrl,
		price: price,
		description: description,
		userId: req.session.user._id,
	});
	product
		.save()
		.then(() => res.redirect("/admin/product-list"))
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getAdminProductList = (req, res, next) => {
	Product.find({ userId: req.session.user._id }) //
		.then((products) => {
			res.render("admin/product-list", {
				prods: products,
				pageTitle: "M-Mart | Products",
				path: "/admin/product-list",
				error: req.flash("error"),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;
	const prodId = req.params.id;
	const isLoggedIn = req.session.isLoggedIn;

	Product.findById(prodId)
		.then((product) => {
			if (product)
				res.render("admin/edit-product", {
					product: product,
					editing: editMode,
					pageTitle: "M-Mart | Edit",
					path: "/edit-product",
					isAuthenticated: isLoggedIn,
					error: [],
					errorParam: null,
				});
			else res.redirect("admin/product-list");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postEditProduct = (req, res, next) => {
	const prodId = req.params.id;
	const { title, price, description } = req.body;
	const image = req.file;

	Product.findById(prodId)
		.then((product) => {
			if (product.userId.toString() !== req.session.user._id.toString()) {
				req.flash(
					"error",
					"You can't edit products which are not added by you."
				);
				return res.redirect("/admin/product-list");
			}
			product.title = title;
			if (image) {
				fileHelper.deleteFile(product.imageUrl);
				product.imageUrl = image.path;
			}
			product.price = price;
			product.description = description;
			return product.save().then(() => res.redirect("/admin/product-list"));
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.DeleteProduct = (req, res, next) => {
	const prodId = req.params.productId;

	Product.findById(prodId)
		.then((product) => {
			fileHelper.deleteFile(product.imageUrl);

			return Product.deleteOne({ _id: prodId, userId: req.session.user._id });
		})
		//deleting from product collection
		.then((result) => {
			if (result.deletedCount === 0) {
				req.flash(
					"error",
					"You can't delete product which are not added by you!."
				);
				return res.redirect("/admin/product-list");
			}
			const updatedCart = req.session.user.cart.items.filter(
				(i) => i.productId.toString() != prodId.toString()
			);
			req.session.user.cart.items = updatedCart; //updating cart
			return (
				req.user
					.save() //saving updated cart
					//deleting product form orders collection
					.then(() => {
						let updatedOrders = [];
						const ordersId = [];
						return Order.find().then((orders) => {
							updatedOrders = orders.map((order) => {
								ordersId.push(order._id.toString());
								const updatedItems = order.items.filter(
									(item) => item.product._id.toString() != prodId.toString()
								);
								order.items = updatedItems;
								return order;
							});

							//removed product from order
							updatedOrders = updatedOrders.filter((o) => o.items.length !== 0);
							return [ordersId, updatedOrders];
						});
					})
					.then(([ordersId, updatedOrders]) => {
						//delete all orders
						return Order.deleteMany({ _id: { $in: ordersId } }).then(() => {
							//insert updated orders
							Order.insertMany(updatedOrders);
						});
					})
					.then(() => {
						return res.status(200).json({ message: "Success!" });
					})
			);
		})
		.catch((err) => {
			res.status(500).json({ message: "Deleting product failed" });
		});
};
