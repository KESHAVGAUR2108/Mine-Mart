const mongoose = require("mongoose");

const Product = require("./product");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
	items: [
		{
			product: {
				type: Object,
				required: true,
			},
			quantity: { type: Number, required: true },
		},
	],
	user: {
		email: {
			type: String,
			required: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
	},
});

module.exports = mongoose.model("Order", orderSchema);
