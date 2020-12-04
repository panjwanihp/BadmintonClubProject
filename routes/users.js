const express = require('express');
const router = express.Router();
const gravatar= require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoQuery = require('../mongoQuery/query2mongo');
const message = require('../utils/enum');
const randtoken = require('rand-token');
const sendEmail = require('../utils/send_email');
const updateUser =  require('../api/updateUser');
const verifcationController = require('../api/verification');
const {check , validationResult } = require('express-validator');

const User = require('../models/User');
const { response } = require('express');

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

//ResetPasswordmail
router.get('/resetpasswordmail',async (req,res)=>{
    var email =req.query.email;
    var user = await User.findOne({ email });
    var tmpToken = user.vcode;
    var resetpassword = new sendEmail(user.email, 'resetPassword', tmpToken)
    resetpassword.email()
        .then(sent => {
            sent.message = message.SUCCESSFULL_REGISTRATION;
            return res.status(200).json({"msg":message.EMAIL_SENT});
        })
        .catch(sentErr => {
            console.log(sentErr);
            return res.status(500).send(message.SERVER_ERROR);
        })
});

//ResetPassword
router.post(
    "/resetpassword", 
    [
        check('email',message.EMAIL_CHECK).isEmail(),
        check('password', message.PASSWORD_CHECK).isLength({min:6}),
    ], 
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        const {email, password, token} = req.body;
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(password,salt);
        updateUser.resetPassword(email,newPassword,token)
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

//@route   GET /users/register
//@desc    Register user
//@access  Public
router.post(
    "/register", 
    [
        check('name',message.NAME_CHECK).not().isEmpty(),
        check('email',message.EMAIL_CHECK).isEmail(),
        check('password', message.PASSWORD_CHECK).isLength({min:6}),
        check('phone.digits', message.MOBILE_CHECK).isLength({ min: 10, max: 10 })
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
                return res.status(400).json({errors: [message.USER_EXISTS]});
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
            var registerEmail = new sendEmail(query, 'accountActivation', tmpToken)
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
            return res.status(500).send(message.SERVER_ERROR);
        }
});

module.exports = router;