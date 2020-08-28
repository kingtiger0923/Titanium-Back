const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./api');
const { ObjectId } = require('mongodb');

const db = require('./db');

const app = express();
const appPort = 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use('/public', express.static('pdfs'));
app.use('/products', express.static('inventory'));

app.use(apiRoutes);

var server = app.listen(appPort, () => console.log(`Server running on port ${appPort}`));
// Socket
const io = require('socket.io')(server);
const MESSAGECollection = require('./models/MessageModel');
const UserCollection = require('./models/UserModel');

io.sockets.on('connection', function(socket) {
  MESSAGECollection.find({}).then(his => {
    socket.emit('history', his.slice(Math.max(his.length - 15, 0)));
  })

  socket.on('totop', function(len) {
    MESSAGECollection.find({}).then(his => {
      if( his.length > len ) {
        setTimeout(function() {
          socket.emit('newhistory', his.slice(Math.max(his.length - 15 - len, 0)));
        }, 1000);
      } else {
        socket.emit('newhistory', "nodata");
      }
    });
  });

  socket.on('message', function(msg) {
    let curDate = new Date();
    msg.timestamp = curDate;
    MESSAGECollection.create(msg).then(created => {
      msg._id = created._id;
      io.emit("message", msg);
      UserCollection.find({}).then(users => {
        for( let i = 0; i < users.length; i ++ ) {
          if( users[i].unreadCount === undefined ) {
            users[i].unreadCount = 1;
          } else {
            users[i].unreadCount += 1;
          }
          users[i].save();
        }
      })
    });
  });

  socket.on('delete', function(id) {
    MESSAGECollection.deleteOne({_id: ObjectId(id)}).then(() => {
      io.emit('deleted', id);
    })
  })
});
// End Socket
