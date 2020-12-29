const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');
const message = require('../utils/enum');
const timeCheck =  require('../api/timeCheck');
const bookingCheck =  require('../api/bookingCheck');
const auth = require('../middleware/auth');
const {check , validationResult } = require('express-validator');
const sendEmail = require('../utils/send_email');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { response } = require('express');
const User = require('../models/User');
const moment = require('moment');

router.post(
    "/", [ auth,
    [
        check('type',message.B_TYPE_CHECK).not().isEmpty(),
        check('date',message.B_ST_CHECK).not().isEmpty(),
        check('start_time',message.B_ST_CHECK).not().isEmpty(),
        check('end_time', message.B_ET_CHECK).not().isEmpty(),        
        check('court', message.B_COURT_CHECK).not().isEmpty()
    ] ],    
    async (req,res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        const {type,date, start_time, end_time, court} = req.body;
        try{
            // let booking = await Booking.findOne({ court_name: court }); 
           // console.log(req.user.id);
            let court1 = await Court.findOne({ court_name: court });
            
            if(!court1){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            if(start_time >= end_time || (date <= timeCheck.dateFormate(new Date()))){
                return res.status(400).json({errors: [message.INVALID_TIME_RANGE]});
            }
            let bookings = await Booking.find({$and : [{"date" : date},{"court":court1.id},{"status" : 1}]});

            if(timeCheck.checkBookingOverlapforCourt(start_time,end_time,bookings)){
                return res.status(400).json({errors: [message.ALREADY_BOOKED_TIME_RANGE]});
            }

            if(timeCheck.checkBookingOverlapforBreak(start_time,end_time,court1.court_break) || !(start_time >= court1.start_time && start_time < court1.end_time && end_time <= court1.end_time && end_time > court1.start_time)){
                return res.status(400).json({errors: [message.BREAK_TIME_RANGE]});
            }
            var startTime=moment(start_time, "HH:mm:ss");
            var endTime=moment(end_time, "HH:mm:ss");
            var duration = moment.duration(endTime.diff(startTime));
            var hours = parseFloat(duration.asHours());

            let totamount = court1.price*(hours);
            let amount = totamount;
            if(type == 1){
                amount = totamount/2;
            }else if(type == 2){
                amount = totamount/4;
            }

            const user = await User.findById(req.user.id);
            var wallet = user.wallet;
            if(user.wallet < amount){
                return res.status(400).json({errors: [message.INSUFFICIENT_AMOUNT]});
            }else{
                wallet = wallet - amount;
            }
            booking_obj = new Booking({
                type,
                date,
                start_time,
                end_time,
                court_full: type == 0? true: false,
                court: court1.id,
                amount: totamount,
                players: [{
                    payment: amount,
                    user: req.user.id
                    
                }]
            });                        
           booking_obj.save();

            await User.update(
                { _id: req.user.id},
                { $set: {
                    wallet: wallet
                }}
            );
            const mail_obj = {
                type : type,
                date : date,
                start_time:start_time,
                end_time:end_time,
                court: 'Court '+court1.court_name,
                court_price : court1.price,
                amount : totamount
            }
            var newBooking = null;
            if(type == '0'){
                newBooking = new sendEmail(user, 'newBookingEntire', mail_obj)
            }else{
                newBooking = new sendEmail(user, 'newBooking', mail_obj)
            }
            newBooking.emailNewBooking()
                .then(sent => {
                    sent.message = message.SUCCESSFULL_REGISTRATION;
                    return res.status(200).json({"msg":message.EMAIL_SENT, "booking":booking_obj});
                })
                .catch(sentErr => {
                    console.log(sentErr);
                    return res.status(200).json({"msg":message.SERVER_ERROR, "booking":booking_obj});
                })

            
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
            let booking = await Booking.aggregate([
                {$match : {"date" : {$gte : timeCheck.dateFormate(new Date()),
                        $lt : timeCheck.dateFormate(new Date().setMonth(new Date().getMonth()+6))} , "status" : 1}},
                {$lookup : {
                    from: "courts",
                    let: { court_obj: "$court" },
                    pipeline: [
                        { $match: { $expr: {$eq :[ "$_id",  "$$court_obj" ] } }},
                        {$project : {
                            _id : 0, 
                            start_time : 0, 
                            end_time : 0,
                            __v :0,
                            court_break : 0 
                        }}
                    ],
                    as: "court"
                    }},
                { $unwind :  { path:"$court" }}, 
                {$lookup:{
                    from: "users", 
                    let: { user_obj: "$players.user" },
                    pipeline: [
                        { $match: { $expr: {$in :[ "$_id",  "$$user_obj" ] } }},
                        {$project : {
                            
                            role : 0, 
                            status : 0,  
                            password : 0, 
                            date : 0, 
                            vcode :  0, 
                            __v :0,
                            wallet : 0 
                        }}
                    ],
                    as: "user",      
                }
            },
            //  { "$addFields": {
            //     "merged_user_info": {
            //         "$map": {
            //             "input": "$players",
            //             "in": {
            //                 "$mergeObjects": [
            //                     "$$this",
            //                     { "$arrayElemAt": [
            //                         "$user._id",
            //                         {"$indexOfArray" : ["$$this.user" , "user._id"]}
            //                     ] }
            //                 ] 
            //             }
            //         }
            //     }
            // } }
            ]);
            
            // if(!booking){
            //     return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            // }
            //console.log(booking)
            res.status(200).json(booking);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

router.get(
    "/userLength",
    auth, 
    async (req,res) => {
        try{
            console.log(req.user.id);
            let booking = await Booking.find({players: {$elemMatch: {user : req.user.id}}, status : 1 });

            
            // if(!booking){
            //     return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            // }
            //console.log(booking)
            res.status(200).json({Length : booking.length});
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});
router.get(
    "/userLength/:userId",
    auth, 
    async (req,res) => {
        try{
            console.log(req.params.userId);
            let booking = await Booking.find({players: {$elemMatch: {user : req.params.userId}}, status : 1 });
            let canceledbooking = await Booking.find({players: {$elemMatch: {user : req.params.userId}}, status : 0 });

            
            // if(!booking){
            //     return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            // }
            //console.log(booking)
            res.status(200).json({Length : booking.length, canceledLength : canceledbooking.length});
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
            let booking = await Booking.find({"date" : req.params.booking_date});
            
            if(!booking){
                return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
            }
            res.status(200).json(booking);
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
});

// router.put(
//     "/update/:booking_id",
//     auth, 
//     async (req,res) => {
//         const {court_name, start_time, end_time, price, court_break} = req.body;        
//         try{
//             //see if user exist
//             let booking = await Booking.findOne({ _id: req.params.booking_id });
            
//             if(!court){
//                 return res.status(400).json({errors: [message.COURT_NOT_EXISTS]});
//             }
//             console.log(court);
            
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
router.put(
    "/update/:booking_id/:amounttopay",
    auth, 
    async (req,res) => {
        const amount = req.params.amounttopay; 
        const numofplayer = 1;
        try{
            const { playersBooked } =req.body
            //see if booking
            let booking = await Booking.findOne({ _id: req.params.booking_id });
            let court1 = await Court.findOne({ _id: booking.court });
            if(!booking){
                return res.status(400).json({errors: [message.BOOKING_NOT_EXISTS]});
            }
            if(bookingCheck.checkPlayerAvailable(booking,req.user.id)){
                return res.status(400).json({errors: [message.USER_ALREADY_BOOKED]});
            }
            if(numofplayer > (parseInt(booking.type)*2 - booking.players.length)){
                 return res.status(400).json({errors: [message.MORE_NUMBER_OF_PLAYERS]});
            }
            const user = await User.findById(req.user.id);
            wallet = user.wallet;
            if(user.wallet < amount){
                return res.status(400).json({errors: [message.INSUFFICIENT_AMOUNT]});
            }else{
                wallet = user.wallet - amount;
                console.log(wallet)
            }

            player = {
                payment : amount,
                user : req.user.id
            }

            const court_full_change = {
                    court_full:false
            }

            if(numofplayer == (parseInt(booking.type)*2 - booking.players.length)){
                court_full_change.court_full = true;
            }
            // var model = require(`../models/Booking`);
            await Booking.update(
                { _id: req.params.booking_id },
                { $push: { players: player } ,
                $set: {
                    court_full : court_full_change.court_full
                } }
            );
            
            await User.update(
                { _id: req.user.id},
                { $set: {
                    wallet: wallet
                }}
            );
            
            const mail_obj = {
                type : booking.type,
                date : booking.date,
                start_time:booking.start_time,
                end_time:booking.end_time,
                court: 'Court '+court1.court_name,
                court_price : court1.price,
                amount : amount,
                players : playersBooked
            }
            var joinParty = null;
            if(parseInt(booking.type)*2 - booking.players.length - 1){
               joinParty = new sendEmail(user, 'joinParty', mail_obj)
                joinParty.emailNewBooking()
                .then(sent => {
                    sent.message = message.SUCCESSFULL_REGISTRATION;
                    return res.status(200).json({"msg_email":message.EMAIL_SENT, "msg":"Successful"});
                })
                .catch(sentErr => {
                    console.log(sentErr);
                    return res.status(200).json({"msg_email":message.SERVER_ERROR, "msg":"Successful"});
                })
            }else{
                const playersBookedobj = playersBooked.split('\n');
                for(var i = 0; i<playersBookedobj.length ; i++){
                    var parametervar = playersBookedobj.split('\t')
                    var newuser = {email : parametervar[1]}
                    joinParty = new sendEmail(newuser, 'joinPartyComplete', mail_obj)
                    joinParty.emailNewBooking()
                        .then(sent => {
                        sent.message = message.SUCCESSFULL_REGISTRATION;
                        return res.status(200).json({"msg_email":message.EMAIL_SENT, "msg":"Successful"});
                    })
                        .catch(sentErr => {
                        console.log(sentErr);
                        return res.status(200).json({"msg_email":message.SERVER_ERROR, "msg":"Successful"});
                    })
                }
                
            }
           

         }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
    }
);
module.exports = router;