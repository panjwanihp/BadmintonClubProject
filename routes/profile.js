const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const message = require('../utils/enum');
//@route   GET /users
//@desc    Description 
//@access  Public
router.get("/", (req,res) => {
    res.send("Profile route");
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