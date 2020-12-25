const express = require('express');
const router = express.Router();
const message = require('../utils/enum');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const stripe = require('stripe')('sk_test_51HysuDFhf22CW4TeWsl8s8lEMaA5aHBV7hLfeXmzwcUAy1wfKwJHGXDX1QsB5xQHdi2tMfYQq1apVQSnxPudxcL900XITTCv3m');

const YOUR_DOMAIN = 'http://localhost:3000/wallet';
router.post('/create-checkout-session/:price', auth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Voucher of $' + req.params.price ,
              //images: ['https://i.imgur.com/EHyR2nP.png'],
            },
            unit_amount: req.params.price*100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/{CHECKOUT_SESSION_ID}`,
    });
    await Payment.updateOne(
          { user: req.user.id},
          { $set: {
              user: req.user.id,
              payment: session.id,
              isExpired : 0
          }
        },{
     upsert: true}
      );

    res.json({ id: session.id });
  }catch(err){
    console.log(err.raw.message);
    return res.status(400).send(err.raw.message);
  }
});

router.post('/check-payement/:sessionId',auth, async (req, res) => {
  try {
    var sessionExpired = await Payment.findOne({user : req.user.id});
    console.log(sessionExpired.payment,sessionExpired.isExpired );
    let sessionId =  await stripe.checkout.sessions.retrieve(req.params.sessionId);
    console.log(sessionId)
    if(sessionExpired.payment === sessionId.id && sessionExpired.isExpired === 0){
      console.log("checked");
      await Payment.updateOne(
            { user: req.user.id},
            { $set: {
                payment : "",
                isExpired : 1
              }
            }
      );
      
      if (sessionId.payment_status === 'paid') {
      
        const user = await User.findById(req.user.id);
        var wallet = user.wallet + (sessionId.amount_total/100);
        await User.updateOne(
            { _id: req.user.id},
            { $set: {
                wallet: wallet
            }}
        );
        
        return res.status(200).send("Success");  
      }else{
        return res.status(400).send("Failed");
      }
    }else{
       return res.status(200).send("retry ");;
    }
  }catch(err){
    return res.status(400).send(err);
  }
});

module.exports = router;