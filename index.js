const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./api');

const db = require('./db');

const app = express();
const appPort = 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(apiRoutes);

app.listen(appPort, () => console.log(`Server running on port ${appPort}`));