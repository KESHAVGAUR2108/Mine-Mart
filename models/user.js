const mongoose = require("mongoose");

const Product = require("./product");
const Order = require("./order");

const Schema = mongoose.Schema;

const userSchema = new Schema({
	name: {
		type: String,
		// required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	resetToken: String,
	resetTokenExpiration: Date,
	cart: {
		items: [
			{
				productId: {
					type: mongoose.Types.ObjectId,
					required: true,
					ref: Product,
				},
				quantity: { type: Number, required: true },
			},
		],
	},
});

userSchema.methods.addToCart = function (product) {
	let cartProductIndex = -1;
	let updatedCartItems = [];

	if (this.cart) {
		cartProductIndex = this.cart.items.findIndex(
			(cp) => cp.productId.toString() === product._id.toString()
		);

		updatedCartItems = [...this.cart.items];
	}

	if (cartProductIndex >= 0) {
		//Product is already in the cart
		let newQty = updatedCartItems[cartProductIndex].quantity + 1;
		updatedCartItems[cartProductIndex].quantity = newQty;
	} else {
		updatedCartItems.push({ productId: product._id, quantity: 1 });
	}

	this.cart.items = updatedCartItems;
	return this.save();
};

userSchema.methods.removeCart = function (prodId) {
	const updatedCartItems = this.cart.items.filter(
		(item) => item.productId.toString() !== prodId.toString()
	);

	this.cart.items = updatedCartItems;
	return this.save();
};

userSchema.methods.updateQty = function (prodId, op) {
	const productIndex = this.cart.items.findIndex(
		(item) => item.productId.toString() === prodId.toString()
	);

	if (op === "inc") {
		this.cart.items[productIndex].quantity += 1;
	} else {
		this.cart.items[productIndex].quantity -= 1;
	}

	if (this.cart.items[productIndex].quantity <= 0) {
		this.cart.items.splice(productIndex, 1);
	}

	return this.save();
};

module.exports = mongoose.model("User", userSchema);
// const mongodb = require("mongodb");
// const { getDB } = require("../util/database");

// const ObjectId = mongodb.ObjectId;

// class User {
// 	constructor(name, email, cart, id) {
// 		this._id = id ? new ObjectId(id) : null;
// 		this.name = name;
// 		this.email = email;
// 		this.cart = cart; // cart = {items: []}
// 	}

// 	save() {
// 		const db = getDB();
// 		return db.collection("users").insertOne(this);
// 	}

// 	addToCart(product) {
// 		let cartProductIndex = -1;
// 		let updatedCartItems = [];

// 		if (this.cart) {
// 			cartProductIndex = this.cart.items.findIndex(
// 				(cp) => cp.productId.toString() === product._id.toString()
// 			);

// 			updatedCartItems = [...this.cart.items];
// 		}

// 		if (cartProductIndex >= 0) {
// 			//Product is already in the cart
// 			let newQty = updatedCartItems[cartProductIndex].quantity + 1;
// 			updatedCartItems[cartProductIndex].quantity = newQty;
// 		} else {
// 			updatedCartItems.push({ productId: product._id, quantity: 1 });
// 		}

// 		const updatedCart = { items: updatedCartItems };
// 		const db = getDB();
// 		return db
// 			.collection("users")
// 			.updateOne(
// 				{ _id: new ObjectId(this._id) },
// 				{ $set: { cart: updatedCart } }
// 			);
// 	}

// 	getCart() {
// 		const db = getDB();
// 		const cartItemsId = this.cart.items.map((item) => item.productId);

// 		return db
// 			.collection("products")
// 			.find({ _id: { $in: cartItemsId } })
// 			.toArray()
// 			.then((products) => {
// 				return products.map((p) => {
// 					return {
// 						...p,
// 						quantity: this.cart.items.find((item) => {
// 							return item.productId.toString() === p._id.toString();
// 						}).quantity,
// 					};
// 				});
// 			})
// 			.catch((err) => console.log(err));
// 	}

// 	updateCart(prodId, op) {
// 		const db = getDB();

// 		const prodIndex = this.cart.items.findIndex(
// 			(item) => item.productId.toString() === prodId.toString()
// 		);

// 		if (op === "inc") {
// 			this.cart.items[prodIndex].quantity += 1;
// 		} else {
// 			this.cart.items[prodIndex].quantity -= 1;
// 		}

// 		if (this.cart.items[prodIndex].quantity <= 0) {
// 			this.cart.items = this.cart.items.filter(
// 				(item) => item.productId.toString() != prodId.toString()
// 			);
// 		}
// 		return db
// 			.collection("users")
// 			.updateOne(
// 				{ _id: new ObjectId(this._id) },
// 				{ $set: { cart: this.cart } }
// 			);
// 	}

// 	addOrder() {
// 		const db = getDB();
// 		return this.getCart()
// 			.then((products) => {
// 				const order = {
// 					items: products,
// 					user: {
// 						_id: new ObjectId(this._id),
// 						name: this.name,
// 					},
// 				};
// 				return db.collection("orders").insertOne(order);
// 			})
// 			.then(() => {
// 				this.cart = { items: [] };
// 				return db
// 					.collection("users")
// 					.updateOne(
// 						{ _id: new ObjectId(this._id) },
// 						{ $set: { cart: { items: [] } } }
// 					);
// 			});
// 	}

// 	getOrderedItems() {
// 		const db = getDB();
// 		return db
// 			.collection("orders")
// 			.find()
// 			.toArray()
// 			.then((orders) => orders)
// 			.catch((err) => console.log(err));
// 	}

// 	removeCart(prodId) {
// 		const updatedCartItems = this.cart.items.filter(
// 			(item) => item.productId.toString() !== prodId.toString()
// 		);

// 		const db = getDB();

// 		return db
// 			.collection("users")
// 			.updateOne(
// 				{ _id: new ObjectId(this._id) },
// 				{ $set: { cart: { items: updatedCartItems } } }
// 			);
// 	}

// 	static findById(userId) {
// 		const db = getDB();
// 		return db
// 			.collection("users")
// 			.find({ _id: new ObjectId(userId) })
// 			.next();
// 	}
// }

// module.exports = User;
