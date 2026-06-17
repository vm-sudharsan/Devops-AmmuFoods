const Product = require("../models/Product.model");
const { uploadImage, deleteImage } = require("../services/cloudinary.service");

// PUBLIC: Get all available products
const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isAvailable: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// PUBLIC: Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// ADMIN: Create product
const createProduct = async (req, res) => {
  try {
    const { name, description, category, unit, pricePerUnit, currentStock, minimumStockLevel, image } = req.body;

    if (!name || !unit || !pricePerUnit) {
      return res.status(400).json({ success: false, message: "Name, unit, and price are required" });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (image) {
      try {
        const result = await uploadImage(image, "ammufoods/products");
        imageUrl = result.url;
        imagePublicId = result.publicId;
      } catch {
        return res.status(400).json({ success: false, message: "Failed to upload image" });
      }
    }

    const product = await Product.create({
      name,
      description,
      category,
      unit,
      pricePerUnit: Number(pricePerUnit),
      currentStock: Number(currentStock) || 0,
      minimumStockLevel: Number(minimumStockLevel) || 10,
      imageUrl,
      imagePublicId,
      isAvailable: true,
    });

    res.status(201).json({ success: true, message: "Product created", product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create product", error: error.message });
  }
};

// ADMIN: Update product
const updateProduct = async (req, res) => {
  try {
    const { name, description, category, unit, pricePerUnit, currentStock, minimumStockLevel, isAvailable, image } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (image) {
      try {
        if (product.imagePublicId) await deleteImage(product.imagePublicId);
        const result = await uploadImage(image, "ammufoods/products");
        product.imageUrl = result.url;
        product.imagePublicId = result.publicId;
      } catch {
        return res.status(400).json({ success: false, message: "Failed to upload image" });
      }
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (unit) product.unit = unit;
    if (pricePerUnit !== undefined) product.pricePerUnit = Number(pricePerUnit);
    if (currentStock !== undefined) product.currentStock = Number(currentStock);
    if (minimumStockLevel !== undefined) product.minimumStockLevel = Number(minimumStockLevel);
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await product.save();
    res.json({ success: true, message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update product", error: error.message });
  }
};

// ADMIN: Disable product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isAvailable: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product disabled", product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to disable product" });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
