const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// Primary Routes

const userRouter = require('./routes/user.route');
const todoRouter = require('./routes/todo.route');

app.use('/api/v1/users',userRouter);
app.use('/api/v1/todos',todoRouter);

module.exports = app;