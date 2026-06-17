/**
 * Seed script — clears all existing data and inserts the 4 real products.
 * Run with: node scripts/seedProducts.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/Product.model");

const products = [
  {
    name: "Elaneer Payasam",
    description:
      "A refreshing and creamy payasam made from fresh tender coconut water and coconut meat, lightly sweetened and served chilled. A signature Ammu Foods delicacy.",
    category: "Payasam",
    unit: "Piece",
    pricePerUnit: 150,
    currentStock: 100,
    minimumStockLevel: 10,
    isAvailable: true,
  },
  {
    name: "Jigirthanda",
    description:
      "The iconic Madurai-style cold drink layered with nannari syrup, almond gum, reduced milk, and ice cream. Rich, indulgent, and utterly refreshing.",
    category: "Drinks",
    unit: "Piece",
    pricePerUnit: 200,
    currentStock: 100,
    minimumStockLevel: 10,
    isAvailable: true,
  },
  {
    name: "Sweet Beeda",
    description:
      "Traditional betel leaf sweet rolls filled with aromatic spices, coconut, and sugar. A classic post-meal treat that leaves a lasting impression.",
    category: "Sweets",
    unit: "Piece",
    pricePerUnit: 30,
    currentStock: 200,
    minimumStockLevel: 20,
    isAvailable: true,
  },
  {
    name: "Ice Creams",
    description:
      "Homemade ice creams crafted with natural flavours and fresh ingredients. Available in a variety of traditional Indian flavours for every occasion.",
    category: "Ice Cream",
    unit: "Piece",
    pricePerUnit: 80,
    currentStock: 150,
    minimumStockLevel: 15,
    isAvailable: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to:", mongoose.connection.db.databaseName);

    // Clear existing products and event requests
    const deletedProducts = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${deletedProducts.deletedCount} existing products`);

    // Also clear event requests (test data)
    const EventRequest = require("../src/models/EventRequest.model");
    const deletedEvents = await EventRequest.deleteMany({});
    console.log(`🗑️  Cleared ${deletedEvents.deletedCount} existing event requests`);

    // Insert fresh products
    const inserted = await Product.insertMany(products);
    console.log(`✅ Inserted ${inserted.length} products:`);
    inserted.forEach((p) => console.log(`   • ${p.name} (${p._id})`));

    console.log("\n🎉 Database seeded successfully for production!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
