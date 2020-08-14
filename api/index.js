var express = require('express');
var router = express.Router();
var md5 = require('md5');
var jwt = require('jsonwebtoken');
const jwtSecret = 'ABTWOFKRSJDKFTLSKFJSOWK';
var multer = require('multer');

var storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({storage});

const UserCollection = require('../models/UserModel');
const UploadCollection = require('../models/UploadModel');

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
      if( !user.active ) {
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
          token: token,
          admin: user.admin
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
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'expired'
        }));
      } else {
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'Invalid Token'
        }));
      }
      return ;
    }
    console.log(decoded);
    res.send(JSON.stringify({
      code: 'Success',
      message: 'Successfully Verified'
    }));
  });
});

router.post('/adminData', (req, res) => {
  const token = req.body.token;
  if( token === undefined || token === '' ) {
    res.send(JSON.stringify({
      code: 'Failed',
      message: 'Not Logged In'
    }));
    return ;
  }
  console.log(token);
  jwt.verify(token, jwtSecret, function(err, decoded) {
    if( err ) {
      if( err.message === 'jwt expired' ) {
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'expired'
        }));
      } else {
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'Not Logged In'
        }));
      }
      return ;
    }
    UploadCollection.find({}).then(upload => {
      return upload;
    }).then(uploads => {
      UserCollection.find({}).then(users => {
        res.send(JSON.stringify({
          users,
          uploads
        }));
      })
    });
  });
});

router.post('/userData', (req, res) => {
  const token = req.body.token;
  jwt.verify(token, jwtSecret, function(err, decoded) {
    if( err ) {
      if( err.message === 'jwt expired' ) {
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'expired'
        }));
      } else {
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'Not Logged In'
        }));
      }
      return ;
    }
    UploadCollection.find({}).then(upload => {
      return upload;
    }).then(uploads => {
      UserCollection.find({}).then(users => {
        res.send(JSON.stringify({
          users,
          uploads
        }));
      })
    });
  });
});

router.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);
  const fileName = req.file.filename;
  const splits = fileName.split('.');
  const type = splits[splits.length - 1];
  const curDate = new Date();
  const dateText = curDate.getFullYear() + '/' + curDate.getMonth() + '/' + curDate.getDate()
              + ' ' + curDate.getHours() + ':' + curDate.getMinutes() + ':' + curDate.getSeconds();

  UploadCollection.find({fileName}).then(obj => {
    if( obj !== null ) {
      UploadCollection.create({
        fileName: fileName,
        fileType: type,
        date: dateText,
        title: fileName,
        author: fileName
      });
      res.send("success");
    }
  })
});

module.exports = router;