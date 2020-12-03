const express = require('express');
const router = express.Router();
const gravatar= require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const nodemailer = require('nodemailer');

const message = require('../utils/enum');
const randtoken = require('rand-token');
const sendEmail = require('../utils/send_email');

const verifcationController = require('../api/verification');
const {check , validationResult } = require('express-validator');

const User = require('../models/User');
//@route   GET /users/register
//@desc    Register user
//@access  Public
router.post(
    "/register", 
    [
        check('name','Name is Required.').not().isEmpty(),
        check('email','Please include a valid Email').isEmail(),
        check('password', 'Please enter a password with 6 or more Character').isLength({min:6}),
        check('phone.digits', 'Mobile number should contains 10 digits').isLength({ min: 10, max: 10 })
    ], 
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        //res.send("user routes")
        const {name, email, password, phone} = req.body;
        try{
            //see if user exist
            let user = await User.findOne({ email });
            
            if(user){
                return res.status(400).json({errors: ["User already exists."]});
            }

            //get User webtoken
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });
            
            user = new User({
                name,
                email,
                avatar,
                password,
                phone
            });
            
            //encrypt password
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password,salt);
            
            var query = { "email": user.email };
            var tmpToken = randtoken.generate(30);
            user.vcode = tmpToken;
            user.save()
            var registerEmail = new sendEmail(user.email, 'accountActivation', tmpToken)
                        registerEmail.email()
                            .then(sent => {
                                sent.message = message.SUCCESSFULL_REGISTRATION;
                                //return resolve(sent)
                            })
                            .catch(sentErr => {
                                console.log(sentErr);
                                //return reject(sentErr)
                            })
            const payload = {
                user: {
                    id: user.id
                }
            };
            jwt.sign(
                payload,
                config.get("jwtToken"),
                {
                    expiresIn: 36000
                },
                (err , token) =>{
                    if(err) throw err;
                    res.json({token});
                }
            );
            
        }catch(err){
            console.error(err.message);
            return res.status(500).send("server error");
        }
    }
);

//Verification user
router.get('/verify',(req,res)=>{
    console.log(req.query.email)
    verifcationController.verifyEmail(req.query.email,req.query.key)
    .then(verification=>{
        res.status(verification.code).json({
            result: verification.result,
            code: verification.code,
            message: verification.message
        })
    })
    .catch(verificationError=>{
     
        res.status(verificationError.code).json({
            result: verificationError.result,
            code: verificationError.code,
            message: verificationError.message
        })
    })
});

module.exports = router;