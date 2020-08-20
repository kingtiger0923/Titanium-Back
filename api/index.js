var express = require('express');
var router = express.Router();
const { ObjectId } = require('mongodb');
// Password Hash MD5
var md5 = require('md5');
// JSON WEB TOKEN
var jwt = require('jsonwebtoken');
const jwtSecret = 'ABTWOFKRSJDKFTLSKFJSOWK';
// File System
var multer = require('multer');
var fs = require('fs');

var storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({storage});

// Mongoose Models
const UserCollection = require('../models/UserModel');
const PDFCollection = require('../models/PDFModel');
const LinkCollection = require('../models/LinksModel');
const InventoryCollection = require('../models/InventoryModel');

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
        active: false
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
// Admin Get Full Data
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
    UserCollection.findOne({email:decoded.email}).then(user => {
      if( user !== null && user.admin && user.active ) {
        PDFCollection.find({}).then(upload => {
          return upload;
        }).then(uploads => {
          UserCollection.find({}).then(users => {
            return {users, pdfs: uploads};
          }).then(data => {
            LinkCollection.find({}).then(links => {
              return {
                ...data,
                links
              };
            }).then(tdata => {
              InventoryCollection.find({}).then(inventory => {
                res.send(JSON.stringify({
                  ...tdata,
                  inventory
                }));
              })
            })
          })
        });
      } else {
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'Not Logged In'
        }));
      }
    });
  });
});
// User Get Full Data
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
    UserCollection.findOne({email:decoded.email}).then(user => {
      if( user !== null && !user.admin && user.active ) {
        PDFCollection.find({}).then(upload => {
          return upload;
        }).then(upload => {
          LinkCollection.find({}).then(links => {
            return {
              pdfs: upload,
              links
            };
          }).then(data => {
            InventoryCollection.find({}).then(inventory => {
              res.send(JSON.stringify({
                ...data,
                inventory
              }));
            });
          })
        });
      } else {
        res.send(JSON.stringify({
          code: 'Failed',
          message: 'Not Logged In'
        }));
      }
    });
  });
});
// Upload PDF
router.post('/pdfupload', upload.single('file'), (req, res) => {
  const fileName = req.file.filename;
  const splits = fileName.split('.');
  const type = splits[splits.length - 1];
  const group = req.query.Type;
  if( type.toLowerCase() !== 'pdf' ) {
    fs.unlinkSync('./uploads/' + fileName);
    res.send("failed");
    return ;
  }
  if( !fs.existsSync('./pdfs') )
    fs.mkdirSync( './pdfs' );
  fs.renameSync('./uploads/' + fileName, './pdfs/'+ group + '-' + fileName);
  const filePath = 'pdfs/'+ group + '-' + fileName;
  const curDate = new Date();
  const dateText = curDate.getFullYear() + '/' + (curDate.getMonth() + 1) + '/' + curDate.getDate()
              + ' ' + curDate.getHours() + ':' + curDate.getMinutes() + ':' + curDate.getSeconds();

  PDFCollection.findOne({fileName, group}).then(obj => {
    if( obj === null ) {
      PDFCollection.create({
        fileName: fileName,
        date: dateText,
        title: fileName,
        author: "Admin",
        filePath: filePath,
        group: group
      });
      res.send("success");
    }
  })
});
// Add Links
router.post('/addlinks', (req, res) => {
  let link = req.body.linkPath;
  let name = req.body.linkName;
  if( link === '' || name === '' || link === undefined || name === undefined ) {
    res.send("failed");
    return ;
  }
  LinkCollection.findOne({link}).then((links) => {
    if( links !== null ) {
      links.name = name;
      links.save();
    } else {
      LinkCollection.create({
        link,
        name
      });
    }
    res.send("success");
  });
});

router.post('/changePermission', (req, res) => {
  let id = req.body.id;
  UserCollection.findOne({_id:ObjectId(id)}).then(user => {
    if( user !== null ) {
      user.active = !user.active;
      user.save();
      res.send("success");
    } else {
      res.send("failed");
    }
  }).catch(err => {
    res.send("failed");
  })
});

router.post('/removepdf', (req, res) => {
  let id = req.body.id;
  console.log(id);
  PDFCollection.deleteOne({_id:ObjectId(id)}).then(() => {
    res.send("success");
  }).catch(() => {
    res.send("Failed");
  });
});
// Upload Inventory
router.post('/addInventory', upload.single('file'), (req, res) => {
  const fileName = req.file.filename;
  const splits = fileName.split('.');
  const type = splits[splits.length - 1];
  const iName = req.query.iName;
  const iCount = req.query.iCount;
  if( type.toLowerCase() !== 'jpg' && type.toLowerCase() !== 'png' ) {
    fs.unlinkSync('./uploads/' + fileName);
    res.send("failed");
    return ;
  }
  if( !fs.existsSync('./inventory') )
    fs.mkdirSync( './inventory' );
  fs.renameSync('./uploads/' + fileName, './inventory/' + iName + '.' + type);
  const filePath = 'products/'+ iName + '.' + type;

  InventoryCollection.findOne({name: iName}).then(obj => {
    if( obj === null ) {
      InventoryCollection.create({
        name: iName,
        count: iCount,
        image: filePath
      });
      res.send("success");
    }
  })
});

router.post('/editInventory', (req, res) => {
  const id = req.body.id;
  const val = req.body.val;

  InventoryCollection.findOne({_id: ObjectId(id)}).then(item => {
    if( item !== null ) {
      item.count = val;
      item.save();
      res.send("success");
    } else {
      res.send("Failed");
    }
  }).catch(() => {
    res.send("Failed");
  })
})
module.exports = router;