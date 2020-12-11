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
                res.result = 'Success'
                res.code = 200;
             }
             else{
                res.result = 'Fail'
                res.code = 201;
             }
             return res.send()
    }catch(e){
        console.log(e)
        res.status(500).send(message.SERVER_ERROR);
    }
})

module.exports = router;