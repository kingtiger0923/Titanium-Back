var express = require('express');
var router = express.Router();
var md5 = require('md5');
var jwt = require('jsonwebtoken');
const jwtSecret = 'ABTWOFKRSJDKFTLSKFJSOWK';

const UserCollection = require('../models/UserModel');

// Create User
router.post('/join', (req, res) => {
  let email = req.body.email;
  let lastName = req.body.lastName;
  let firstName = req.body.firstName;
  let password = md5(req.body.password);
  UserCollection.findOne({email}).then(user => {
    if( user === null ) {
      UserCollection.create({
        email,
        firstName,
        lastName,
        password,
        admin: false,
        active: true
      }, function(err) {
        if( err ) {
          res.send(JSON.stringify({
            code: 'failed',
            message: 'Something went wrong on backend, try again!'
          }));
        } else {
          res.send(JSON.stringify({
            code: 'success',
            message: 'Successfully created an account, try Login!'
          }));
        }
      });
    } else {
      res.send(JSON.stringify({
        code: 'failed',
        message: 'You already have an account!'
      }));
    }
  });
});
// User Login
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = md5(req.body.password);
  
  UserCollection.findOne({email}).then(user => {
    if( user === null ) {
      res.send(JSON.stringify({
        code: 'failed',
        message: 'Email is not found!'
      }));
    } else {
      if( !user.active || user.admin ) {
        res.send(JSON.stringify({
          code: 'failed',
          message: 'User is not active now!'
        }));
      } else if( user.password === password ) {
        const token = jwt.sign(
          { email: email },
          jwtSecret,
          { expiresIn: '24h' });
        res.send(JSON.stringify({
          code: 'success',
          message: 'Successfully Logged In!',
          token: token
        }));
      } else {
        res.send(JSON.stringify({
          code: 'failed',
          message: 'Password is not correct!'
        }));
      }
    }
  });
})
// Token Verify
router.post('/verifytoken', (req, res) => {
  const token = req.body.token;
  jwt.verify(token, jwtSecret, function(err, decoded) {
    if( err ) {
      if( err.message === 'jwt expired' ) {
        //
      } else {
        //
      }
    }
  });
});
module.exports = router;