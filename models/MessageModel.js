const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const MESSAGESchema = new Schema({
  msg: String,
  user: {
    first: String,
    last: String,
    email: String
  },
  timestamp: String
});

module.exports = MESSAGECollection = mongoose.model("message", MESSAGESchema);
