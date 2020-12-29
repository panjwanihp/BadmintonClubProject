const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const message = require('../utils/enum');
const sendEmail = require('../utils/send_email');
const User = require('../models/User');

// @route   GET /profile
// @desc    Get all profiles
// @access  Public
router.get('/', auth,  async (req, res) => {
	try{
        const profiles = await User.aggregate([{$match : { role: {$eq : "Member"  }}},
            {$project : {_id : 1 ,name : 1 ,status : 1}}]);
		res.status(200).send(profiles);
	}
	catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


// @route   GET profile/user/:user_id
// @desc    Get user by user ID
// @access  Public
router.get('/user/:user_id',auth, async (req, res) => {
	try{
        console.log("user"+req.params.user_id)
		const user = await User.findOne({ _id: req.params.user_id});
       
		res.status(200).send(user);
	}
	catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   GET profile/approve/:user_id
// @desc    Get user by user ID
// @access  Public
router.get('/approve/:user_id', auth,  async (req, res) => {
	try{
		await User.updateOne({ _id: req.params.user_id},{ $set: {
                status: 2
            }});
        const user =await User.findById(req.params.user_id);
        const Approved = new sendEmail(user, 'accountActivated', '')
        Approved.emailActivated()
                .then(sent => {
                    sent.message = message.SUCCESSFULL_REGISTRATION;
                    return res.status(200).json({"msg_email":message.EMAIL_SENT, "msg":"Successful"});
                })
                .catch(sentErr => {
                    console.log(sentErr);
                    return res.status(200).json({"msg_email":message.SERVER_ERROR, "msg":"Successful"});
                })
		
	}
	catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

router.get('/level/:newlevel', auth,  async (req, res) => {
	try{
		await User.updateOne({ _id: req.user.id},{ $set: {
                level: req.params.newlevel
            }});
		res.status(200).send("successful");
	}
	catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

router.get('/level/:id/:newlevel', auth,  async (req, res) => {
	try{
		await User.updateOne({ _id: req.params.id},{ $set: {
                level: req.params.newlevel
            }});
		res.status(200).send("successful");
	}
	catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   GET profile/unapprove/:user_id
// @desc    Get user by user ID
// @access  Public
router.get('/unapprove/:user_id', auth,  async (req, res) => {
	try{
		await User.updateOne({ _id: req.params.user_id},{ $set: {
                status: 1
            }});
       
		res.status(200).send("successful");
	}
	catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

//@route   GET /users/register
//@desc    Register user
//@access  Public
router.post("/pendingApproval",auth , async (req, res) => {
    try{
        const user = await User.findById(req.user.id);
             console.log(user)
             if(user.role == 'admin'){
                let users = await User.find({"status" : { $in: [ 1 ] } });
            
                if(!users){
                    return res.status(400).json({errors: [message.NO_NEW_USERS_EXISTS]});
                }
                console.log(users);
                res.status(200).json(users);
             }
             else{
                res.result = 'Fail'
                res.code = 201;
             }
             return res.send()
    }catch(e){
        console.log(e)
        res.status(400).send(message.SERVER_ERROR);
    }
})

module.exports = router;