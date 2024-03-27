//This file renders the checkout page (front end) when /checkout endpoint is hit
const router = require('express').Router();

// Define the route for "/checkout"
router.get('/checkout', (req, res) => {
  // Render the "checkout.handlebars" template
  res.render('checkout', {
    logged_in: req.session.logged_in
  }); 
});

module.exports = router;
