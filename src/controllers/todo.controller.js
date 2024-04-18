const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const Todo = require("../models/todo.model.js");

// Controller

// Adding Todo
const addTodo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if ([title, description].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required.");
    }

    const todo = new Todo({ title, description, userId: req?.user?._id });

    const savedTodo = await todo.save();

    return res
        .status(200)
        .json(new ApiResponse(200, savedTodo, "Todo Added Successfully"));
});

// Update Todo by _id
const updateTodo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { todoId } = req.params;

    if ([title, description].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required.");
    }

    const todo = await Todo.findByIdAndUpdate(
        todoId,
        {
            $set: {
                title,
                description,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTodo, "Todo Updated Successfully"));
});

// delete Todo by _id
const deleteTodo = asyncHandler(async (req, res) => {
    const { todoId } = req.params;

    const todo = await Todo.findByIdAndDelete(todoId);

    if (!todo) {
        throw new ApiError(404, "Todo Not Found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, todo, "Todo Deleted Successfully"));
});

// Get Particular Todo by _id
const getParticularTodo = asyncHandler(async (req, res) => {
    const { todoId } = req.params;

    const todo = await Todo.findById(todoId);

    if (!todo) {
        throw new ApiError(404, "Todo Not Found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, todo, "Todo Found Successfully"));
});

// Get All User Todos
const getAllUserTodos = asyncHandler(async (req, res) => {
    const todos = await Todo.find({ userId: req?.user?._id });

    if (!todos) {
        throw new ApiError(404, "Todos Not Found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, todos, "Todos Found Successfully"));
});

// Update Todo Status
const updateTodoStatus = asyncHandler(async (req, res) => {
    const { todoId } = req.params;
    const { status } = req.body;

    const todo = await Todo.findByIdAndUpdate(
        todoId,
        {
            $set: {
                status,
            },
        },
        { new: true }
    );

    if(!todo){
        throw new ApiError(404, "Todo Not Found.");
    }

    return res
       .status(200)
       .json(new ApiResponse(200, todo, "Todo Updated Successfully"));
})

module.exports = {
    addTodo,
    updateTodo,
    deleteTodo,
    getParticularTodo,
    getAllUserTodos,
    updateTodoStatus,
};
