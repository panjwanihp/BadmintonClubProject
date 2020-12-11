const express = require('express');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },  
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    avatar:{
        type: String
    },
    phone: {
        country: { type: String, required: true, default: "+61" },
        digits: { 
            type: String, required: true, min: 10, max: 12 
        }
    },
    role: { type: String, required: false, default: "Member" },
    status: { type: Number, required: false, default: 0 },
    vcode: { type: String, required: false },
    date:{
        type: Date,
        default: Date.now
    },
    wallet:{
        type: Number,
        required: false,
        default: 0
    }
});

module.exports = User = mongoose.model('user',userSchema);