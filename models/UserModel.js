const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  active: Boolean,
  admin: Boolean
});

module.exports = UserCollection = mongoose.model("user", UserSchema);
