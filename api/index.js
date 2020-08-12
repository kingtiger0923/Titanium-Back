var express = require('express');
var router = express.Router();

// Create User
router.post('/join', (req, res) => {
  console.log(req.body);
  res.send("success");
});

module.exports = router;