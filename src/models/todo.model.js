const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{timestamps : true});

const todoModel = mongoose.model('Todo',todoSchema);

module.exports = todoModel;