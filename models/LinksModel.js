const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const LinksSchema = new Schema({
  link: String,
  name: String
});

module.exports = LinkCollection = mongoose.model("link", LinksSchema);
