require('dotenv').config({path: "./app/.env"});
const express = require ('express');
const cors = require('cors');
const path  = require ('path');
const app = express();
const morgan = require('morgan')
const apiRouter = require('./routes/apiRouter');
const port = process.env.PORT || 3000;

app.use (morgan ('common'))
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/app', express.static(path.join (__dirname, '/public')));
app.use('/api', apiRouter);

app.listen(port, () => console.info(`Listening on ${ port }`));