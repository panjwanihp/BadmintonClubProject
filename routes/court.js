const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');
const message = require('../utils/enum');
const auth = require('../middleware/auth');
const {check , validationResult } = require('express-validator');
const timeCheck =  require('../api/timeCheck');
const Court = require('../models/Court');
const { response } = require('express');

router.post(
    "/", [ auth,
    [
        check('court_name',message.C_NAME_CHECK).not().isEmpty(),
        check('start_time',message.C_ST_CHECK).not().isEmpty(),
        check('end_time', message.C_ET_CHECK).not().isEmpty(),
        check('price', message.C_PRICE_CHECK).not().isEmpty()
    ] ],    
    async (req,res) => {

        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        
        const {court_name, start_time, end_time,court_break,price,colour} = req.body;
        try{
            let court = await Court.findOne({ court_name });
            
            if(court){
                return res.status(400).json({errors: [message.COURT_EXISTS]});
            }
            
            if(start_time > end_time){
                return res.status(400).json({errors: [message.INVALID_TIME_RANGE]});
            }
            
            if(timeCheck.rangeOverlappingCheck(court_break)){
                return res.status(400).json({errors: [message.INVALID_BREAK_TIME_RANGE]});
            }

            court = new Court({
                court_name, 
                start_time, 
                end_time, 
                price, 
                court_break,
                colour
            });                        
            
            court.save();
            res.status(200).json(court);
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
            let court = await Court.find();
            
            if(!court){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            
            res.status(200).json(court);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

router.get(
    "/:court_name",
    auth, 
    async (req,res) => {        
        try{
            //see if court exist
            let court = await Court.findOne({ court_name: req.params.court_name });
            
            if(!court){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            res.status(200).json(court);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

router.delete(
    "/:court_name",
    auth, 
    async (req,res) => {        
        try{
            //see if court exist
            let court = await Court.findOne({ court_name: req.params.court_name });
            
            if(!court){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            console.log(court);
            await Court.findOneAndRemove({ court_name: req.params.court_name });
            res.status(200).send("Successful");
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

// router.put(
//     "/update/:court_name",
//     auth, 
//     async (req,res) => {
//         const {court_name, start_time, end_time, price, court_break} = req.body;        
//         try{
//             //see if user exist
//             let court = await Court.findOne({ court_name: req.params.court_name });
            
//             if(!court){
//                 return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
//             }
           
            
//             if(start_time > end_time){
//                 return res.status(400).json({errors: [message.INVALID_TIME_RANGE]});
//             }
            
//             court_obj = {
//                 "court_name": court_name ? court_name : court.court_name, 
//                 "start_time" : start_time ? start_time : court.start_time, 
//                 "end_time" : end_time ? end_time : court.end_time, 
//                 "price" : price ? price : court.price,
//                 "court_break" : court_break ? court_break : court.court_break,
//             };              
//             console.log(court_obj);
//             await Court.findOneAndUpdate(
//                 { court_name: req.params.court_name },
//                 { $set: court },
//                 { new: true, upsert: true, setDefaultsOnInsert: true }
//             );
//             res.status(200).json(court_obj);
//         }catch(err){
//             console.error(err.message);
//             return res.status(500).send(message.SERVER_ERROR);
//         }
// });

module.exports = router;