const express = require('express');
const mongoose = require('mongoose');
const courtSchema = new mongoose.Schema({
    court_name:{
        type: String,
        required: true,
        unique: true
    },
    start_time:{
        type: String,
        required: true        
    },
    end_time:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },    
    court_break: [
        {
            bstart_time: {
                type: String,
                required: true
            },
            bend_time: {
                type: String,
                required: true
            },
            break_name:  {
                type: String,
                required: true
            }
        }
    ],
    colour : {
        type: String,
        required: true
    }
});

module.exports = Court = mongoose.model('court',courtSchema);