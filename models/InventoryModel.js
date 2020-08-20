const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const InventorySchema = new Schema({
  name: String,
  count: Number,
  image: String
});

module.exports = InventoryCollection = mongoose.model("inventory", InventorySchema);
