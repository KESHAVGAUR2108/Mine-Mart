const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const stripe = require("stripe")(
	"sk_test_51MvKh6SESwwRPOxQXmP6ChIFoVi1UNjUah58EiZ4ra5WYlbAO2mUJPrmX4SusIxNJUd8xZBIyWbzhoiykEjCjl5500u6Fagry2"
);

const Product = require("../models/product");
const Order = require("../models/order");

const ItemsPerPage = 10;

exports.getProducts = (req, res, next) => {
	const page = req.query.page;
	Product.find()
		.then((products) => {
			res.render("shop/product-list", {
				prods: products,
				pageTitle: "M-Mart | Home",
				path: "/",
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.findById = (req, res, next) => {
	const prodId = req.params.id;
	Product.findById(prodId)
		.then((product) => {
			if (product) {
				res.render("shop/product-details", {
					product: product,
					pageTitle: product.title,
					path: "/",
				});
			}
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getCart = (req, res, next) => {
	req.user
		.populate("cart.items.productId")
		.then((user) => {
			if (
				user.cart.items.length === 1 &&
				user.cart.items[0].productId === null
			) {
				user.cart.items = [];
			}
			res.render("shop/cart", {
				prod: user.cart.items,
				pageTitle: "Your Cart",
				path: "/shop/cart",
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postCart = (req, res, next) => {
	const prodId = req.params.id;

	Product.findById(prodId)
		.then((product) => req.user.addToCart(product))
		.then(() => res.redirect("/cart"))
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postRemoveCartItem = (req, res, next) => {
	const prodId = req.body.prodId;
	req.user
		.removeCart(prodId)
		.then(() => {
			res.redirect("/cart");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postOrder = (req, res, next) => {
	req.user
		.populate("cart.items.productId")
		.then((user) => {
			const product = user.cart.items.map((i) => {
				return { quantity: i.quantity, product: i.productId._doc };
			});
			const orders = new Order({
				items: product,
				user: { email: req.session.user.email, userId: req.session.user },
			});
			return orders.save();
		})
		.then(() => {
			req.session.user.cart.items = [];
			req.user.cart.items = [];
			req.user.save();
			res.redirect("/order");
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getOrders = (req, res, next) => {
	Order.find({ "user.userId": req.session.user._id })
		.then((orders) => {
			res.render("shop/order", {
				orders: orders,
				pageTitle: "M-Mart | Order",
				path: "/shop/order",
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getIndex = (req, res, next) => {
	const page = +req.query.page || 1;
	let totalItems;

	Product.find()
		.countDocuments()
		.then((numProducts) => {
			totalItems = numProducts;
			return Product.find()
				.skip((page - 1) * ItemsPerPage)
				.limit(ItemsPerPage);
		})
		.then((products) => {
			res.render("shop/product-list", {
				prods: products,
				pageTitle: "M-Mart | Home",
				path: "/",
				currentPage: page,
				totalProducts: totalItems,
				hasNextPage: page * ItemsPerPage < totalItems,
				hasPreviousPage: page > 1,
				nextPage: page + 1,
				nextPage2: page + 1 + 1,
				previousPage: page - 1,
				lastPage: Math.ceil(totalItems / ItemsPerPage),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.updateProductQty = (req, res, next) => {
	const { prodId, op } = req.body;
	req.user
		.updateQty(prodId, op)
		.then(() => res.redirect("/cart"))
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getCheckout = (req, res, next) => {
	let totalPrice = 0;
	let products;
	req.user
		.populate("cart.items.productId")
		.then((user) => {
			products = user.cart.items;
			if (products.length === 1 && products[0].productId === null) {
				products = [];
			}

			products.forEach((p) => {
				totalPrice += p.productId.price * p.quantity;
			});

			return stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				line_items: products.map((p) => {
					return {
						price_data: {
							currency: "inr",
							unit_amount: p.productId.price * 100,
							product_data: {
								name: p.productId.title,
								description: p.productId.description,
							},
						},
						quantity: p.quantity,
					};
				}),
				mode: "payment",
				success_url:
					req.protocol + "://" + req.get("host") + "/checkout/success",
				cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
			});
		})
		.then((session) => {
			res.render("shop/checkout", {
				prod: products,
				pageTitle: "M-Mart | Checkout",
				path: "/shop/checkout",
				totalPrice: totalPrice,
				sessionId: session.id,
			});
		})
		.catch((err) => {
			console.log(err);
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.downloadInvoice = (req, res, next) => {
	Order.findById(req.params.id)
		.then((order) => {
			if (order.user.userId.toString() !== req.user._id.toString()) {
				return next(new Error("Unauthorized user!!"));
			}

			const invoiceName = "invoice-" + req.params.id + ".pdf";
			const invoicePath = path.join("data", invoiceName);

			//Method 3
			const pdfDoc = new PDFDocument();

			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-disposition",
				"attachment; filename=" + invoiceName
			);

			pdfDoc.pipe(fs.createWriteStream(invoicePath));
			pdfDoc.pipe(res);
			pdfDoc.fontSize(30).text("Invoice");
			pdfDoc.fontSize(20).text("ID" + req.params.id.toString());

			let totalPrice = 0;

			pdfDoc
				.fontSize(13)
				.text("+-------------------------------------------------+");
			order.items.forEach(({ product, quantity }) => {
				totalPrice += quantity * product.price;
				pdfDoc.fontSize(10).text("          Title: " + product.title);
				pdfDoc.text("          Price: " + product.price);
				pdfDoc.text("          Quantity: " + quantity);
				pdfDoc
					.fontSize(13)
					.text("+-------------------------------------------------+");
			});
			pdfDoc
				.fontSize(18)
				.text(
					"___________________________________________________________________________________________"
				);
			pdfDoc.text("                        Total Price: " + totalPrice);
			pdfDoc
				.fontSize(18)
				.text(
					"___________________________________________________________________________________________"
				);

			pdfDoc.end();

			//Method 2
			// const file = fs.createReadStream(invoicePath);
			// res.setHeader("Content-Type", "application/pdf");
			// res.setHeader(
			// 	"Content-disposition",
			// 	"attachment; filename=" + invoiceName
			// );
			// file.pipe(res);
			//Method 1
			// fs.readFile(invoicePath, (err, data) => {
			// 	if (err) {
			// 		return next(err);
			// 	}
			// 	res.setHeader("Content-Type", "application/pdf");
			// 	res.setHeader(
			// 		"Content-disposition",
			// 		"attachment; filename=" + invoiceName
			// 	);
			// 	res.send(data);
			// });
		})
		.catch((err) => next(err));
};
