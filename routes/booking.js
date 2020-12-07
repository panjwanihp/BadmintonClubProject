const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');
const message = require('../utils/enum');
const auth = require('../middleware/auth');
const {check , validationResult } = require('express-validator');

const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { response } = require('express');

router.post(
    "/", [ auth,
    [
        check('type',message.B_TYPE_CHECK).not().isEmpty(),
        check('start_time',message.B_ST_CHECK).not().isEmpty(),
        check('end_time', message.B_ET_CHECK).not().isEmpty(),        
        check('court', message.B_COURT_CHECK).not().isEmpty()
    ] ],    
    async (req,res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        const {type, start_time, end_time, court_full, court, players} = req.body;
        try{
            // let booking = await Booking.findOne({ court_name: court }); 
            console.log(court);
            let court1 = await Court.findOne({ court_name: court });
            
            if(!court1){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            
            if(start_time > end_time){
                return res.status(400).json({errors: [message.INVALID_TIME_RANGE]});
            }

            let amount = +court1.price;

            if(type == 1){
                amount = amount/2;
            }else if(type == 2){
                amount = amount/4;
            }
            
            booking_obj = new Booking({
                type,
                start_time,
                end_time,
                court_full: type == 0? true: false,
                court: court1.id,
                players: [{
                    user: req.user.id,
                    payment: [{
                        amount
                    }]
                }]
            });                        
            
            booking_obj.save();
            res.status(200).json(booking_obj);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

router.get(
    "/",
    auth, 
    async (req,res) => {
        try{
            let booking = await Booking.find();
            
            // if(!booking){
            //     return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            // }
            
            res.status(200).json(booking);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

router.get(
    "/:booking_id",
    auth, 
    async (req,res) => {        
        try{
            //see if court exist
            let booking = await Booking.findOne({ _id: req.params.booking_id });
            
            if(!booking){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            res.status(200).json(booking);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

router.get(
    "/date/:booking_date",
    auth, 
    async (req,res) => {        
        try{
            //see if court exist
            let booking = await Booking.find({"start_time" : {$regex : ".*"+req.params.booking_date+".*"}});
            
            if(!booking){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            res.status(200).json(booking);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

router.put(
    "/update/:court_name",
    auth, 
    async (req,res) => {
        const {court_name, start_time, end_time, price, court_break} = req.body;        
        try{
            //see if user exist
            let court = await Court.findOne({ court_name: req.params.court_name });
            
            if(!court){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            console.log(court);
            
            if(start_time > end_time){
                return res.status(400).json({errors: [message.INVALID_TIME_RANGE]});
            }
            
            court_obj = {
                "court_name": court_name ? court_name : court.court_name, 
                "start_time" : start_time ? start_time : court.start_time, 
                "end_time" : end_time ? end_time : court.end_time, 
                "price" : price ? price : court.price,
                "court_break" : court_break ? court_break : court.court_break,
            };              
            console.log(court_obj);
            await Court.findOneAndUpdate(
                { court_name: req.params.court_name },
                { $set: court },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            res.status(200).json(court_obj);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

module.exports = router;