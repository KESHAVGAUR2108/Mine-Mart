const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ProductSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	imageUrl: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	userId: {
		type: mongoose.Types.ObjectId,
		required: true,
	},
});

module.exports = mongoose.model("Product", ProductSchema);

// const mongodb = require("mongodb");

// class Product {
// 	constructor(title, imageUrl, price, desc, id, userId) {
// 		this._id = id ? new mongodb.ObjectId(id) : null;
// 		this.title = title;
// 		this.imageUrl = imageUrl;
// 		this.price = price;
// 		this.description = desc;
// 		this.userId = userId;
// 	}

// 	save() {
// 		const db = getDB();
// 		let dbOp;

// 		if (this._id) {
// 			//Update product
// 			dbOp = db
// 				.collection("products")
// 				.updateOne({ _id: this._id }, { $set: this });
// 		} else {
// 			//insert product
// 			dbOp = db.collection("products").insertOne(this);
// 		}
// 		return dbOp
// 			.then((res) => {
// 				console.log(res);
// 			})
// 			.catch((err) => console.log(err));
// 	}

// 	static fetchAll() {
// 		const db = getDB();
// 		return db
// 			.collection("products")
// 			.find()
// 			.toArray()
// 			.then((products) => products)
// 			.catch((err) => console.log(err));
// 	}

// 	static findById(prodId) {
// 		const db = getDB();
// 		return db
// 			.collection("products")
// 			.find({ _id: new mongodb.ObjectId(prodId) })
// 			.next()
// 			.then((product) => product)
// 			.catch((err) => console.log(err));
// 	}

// 	static deleteById(prodId) {
// 		const db = getDB();
// 		const emptyOrdersId = [];
// 		return db
// 			.collection("products")
// 			.deleteOne({ _id: new mongodb.ObjectId(prodId) })
// 			.then(() => {
// 				return db
// 					.collection("orders")
// 					.find()
// 					.toArray()
// 					.then((orders) => {
// 						return orders.map((order) => {
// 							order.items = order.items.filter(
// 								(item) => item._id.toString() != prodId.toString()
// 							);
// 							if (order.items.length === 0) {
// 								emptyOrdersId.push(order._id);
// 							}
// 							return order;
// 						});
// 					});
// 			})
// 			.then((res) => {
// 				if (res.length > 0) {
// 					db.collection("orders")
// 						.deleteMany()
// 						.then(() => {
// 							db.collection("orders")
// 								.insertMany(res)
// 								.then(() => {
// 									db.collection("orders").deleteMany({
// 										_id: { $in: emptyOrdersId },
// 									});
// 								});
// 						});
// 				}
// 			})
// 			.catch((err) => console.log(err));
// 	}
// }

// module.exports = Product;
