const express = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paymentSchema = new mongoose.Schema({
     user:{
            type: Schema.Types.ObjectId,
            ref: 'users'
          },
    payment:{
                type: String,
                required: true,
                default: false
          },
     isExpired:{
                type: Number,
                required: true,
                default: false
          }
});

module.exports = Booking = mongoose.model('payments', paymentSchema);
    