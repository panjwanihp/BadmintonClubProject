const express = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bookingSchema = new mongoose.Schema({
    type:{
        type: Number, //[0-Full, 1-single, 2-double]
        required: true
    },
    start_time:{
        type: String,
        required: true
    },
    end_time:{
        type: String,
        required: true
    },    
    court_full:{
        type: Boolean,
        required: true,
        default: false
    },
    court: {
        type: Schema.Types.ObjectId,
        ref: 'courts'
    },
    players:[
        {
          user:{
            type: Schema.Types.ObjectId,
            ref: 'users'
          },
          payment:[{}]
        }
    ],
});

module.exports = Booking = mongoose.model('booking', bookingSchema);