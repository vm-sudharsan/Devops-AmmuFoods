const express = require("express");
const { createProduct, getProducts, getProduct, updateProduct, deleteProduct } = require("../controllers/product.controller");

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
