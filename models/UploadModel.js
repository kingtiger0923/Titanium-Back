const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UploadSchema = new Schema({
  fileName: String,
  fileType: String,
  date: String,
  title: String,
  author: String
});

module.exports = UploadCollection = mongoose.model("upload", UploadSchema);
