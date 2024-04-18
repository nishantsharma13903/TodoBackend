const express = require('express');
const verifyUserJWT = require('../middlewares/authUser.middleware');
const { addTodo, updateTodo, deleteTodo, getParticularTodo, getAllUserTodos } = require('../controllers/todo.controller');

const todoRouter = express.Router();

todoRouter.route('/add-todo').post(verifyUserJWT,addTodo);
todoRouter.route('/edit-todo/:todoId').put(verifyUserJWT,updateTodo);
todoRouter.route('/delete-todo/:todoId').delete(verifyUserJWT,deleteTodo);
todoRouter.route('/get-todo/:todoId').get(verifyUserJWT,getParticularTodo);
todoRouter.route('/get-user-todos').get(verifyUserJWT,getAllUserTodos);

module.exports = todoRouter;