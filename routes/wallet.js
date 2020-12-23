const express = require('express');
const router = express.Router();
const message = require('../utils/enum');
const stripe = require('stripe')('sk_test_51HysuDFhf22CW4TeWsl8s8lEMaA5aHBV7hLfeXmzwcUAy1wfKwJHGXDX1QsB5xQHdi2tMfYQq1apVQSnxPudxcL900XITTCv3m');

const YOUR_DOMAIN = 'http://localhost:3000/wallet';
router.post('/create-checkout-session/:price', async (req, res) => {
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
      success_url: `${YOUR_DOMAIN}?success=true`,
      cancel_url: `${YOUR_DOMAIN}?success=false`,
    });
    res.json({ id: session.id });
  }catch(err){
    console.log(err.raw.message);
    return res.status(400).send(err.raw.message);
  }
});

module.exports = router;