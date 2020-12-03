const express = require('express');
const router = express.Router();

//@route   GET /users
//@desc    Description 
//@access  Public
router.get("/", (req,res) => {
    res.send("Profile route");
});

//@route   GET /users/register
//@desc    Register user
//@access  Public


module.exports = router;