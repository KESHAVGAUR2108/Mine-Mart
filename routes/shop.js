const express = require("express");

const router = express.Router();
const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

router.get("/product/:id", isAuth, shopController.findById);
router.get("/cart", isAuth, shopController.getCart);
router.post("/cart", isAuth, shopController.postRemoveCartItem);
router.post("/cart/:id", isAuth, shopController.postCart);
router.get("/order", isAuth, shopController.getOrders);
router.post("/order", isAuth, shopController.updateProductQty);
router.get("/", shopController.getIndex);
router.get("/invoice/:id", isAuth, shopController.downloadInvoice);
router.get("/checkout", isAuth, shopController.getCheckout);
router.get("/checkout/success", isAuth, shopController.postOrder);
router.get("/checkout/cancel", isAuth, shopController.getCheckout);
module.exports = router;
