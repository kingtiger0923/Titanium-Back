const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const PDFSchema = new Schema({
  fileName: String,
  date: String,
  title: String,
  author: String,
  filePath: String,
  group: String
});

module.exports = PDFCollection = mongoose.model("pdf", PDFSchema);
