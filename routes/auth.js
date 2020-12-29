const express = require('express')
const router = express.Router();

const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const message = require('../utils/enum');

const {check , validationResult } = require('express-validator');
const { INVALID_CRED } = require('../utils/enum');

//@route    /auth
//@desc    Description 
//@access  Public
router.get("/", auth , async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(e){
        res.status(400).send(message.SERVER_ERROR);
    }
});

//@route   post 
//@desc    login user
//@access  Public
router.post(
    "/", 
    [
        check('email',message.EMAIL_CHECK).isEmail(),
        check('password',message.PASSWORD_CHECK ).exists()
    ], 
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        //res.send("user routes")
        const { email, password} = req.body;
        try{
            //see if user exist
            let user = await User.findOne({ email });
            
            if(!user){
                console.log(email);
                return res.status(400).json({errors: [{msg  : message.USER_NOT_FOUND_ERROR}]});
            }
            const isMatch = await bcrypt.compare(password,user.password);

            if(!isMatch){
                return res.status(400).json({errors: [{msg  : message.INVALID_CRED}]});
            }
            
            if(user.status != 2 && user.role == "Member"){        
                if(user.status == 0 && user.role == "Member"){
                    return res.status(400).json({errors: [{msg  : message.NOT_VERIFIED}]});
                }
                return res.status(400).json({errors: [{msg  : message.APPROVAL_PENDING}]});
            }
            
            const payload = {
                user: {
                    id: user.id
                }
            };
            jwt.sign(
                payload,
                config.get("jwtToken"),
                {
                    expiresIn: 86400
                },
                (err , token) =>{
                    if(err) throw err;
                    res.json({key:token,role:user.role});
                }
            );
            
        }catch(err){
            console.error(err.message);
            return res.status(500).send(message.SERVER_ERROR);
        }
    }
);

module.exports = router;