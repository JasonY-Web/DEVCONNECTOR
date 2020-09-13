const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
// this is an express middleware, see details in https://github.com/express-validator/express-validator

const User = require('../../models/User');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post('/',   // post a user, and get back a token
   [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
   ],
   async (req, res) => {
      console.log(req.body);  // .body it is now a middleware integrated into express. See in server.js "app.use(express.json({ extended: false }))". Here is to see the DB content.
      const errors = validationResult(req);
      if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
      const { name, email, password } = req.body;
      try {
         let user = await User.findOne({ email });  // see if user exists
         if (user) { return res.status(400).json({ errors: [{ msg: 'User already exists' }] }); }
         // the reason here to use an array for error msg object is to be consistent with error.array() in the above code.
         //get users gravatar
         const avatar = gravatar.url(email, {
            s: '200', r: 'pg', d: 'mm'  // size, rated (PG), default avatar.
         })
         user = new User({ name, email, avatar, password });

         const salt = await bcrypt.genSalt(10);  // 10 is the round to generate encrypted pswd, bigger # is safer but longer time. 10 is recommended by document.
         user.password = await bcrypt.hash(password, salt);      // encrypt password
         await user.save();  // as long as you want a promise, then you need to add the "await".

         const payload = { user: { id: user.id } }   // MDB use _id, but with Mongoose interface you can use .id

         jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 36000 },  // pass the payload and "mySecretToken"
            (err, token) => { if (err) throw err; res.json({ token }); });  // if don't get error, then return JSONwebtoken back to the client. Details in https://github.com/auth0/node-jsonwebtoken and https://jwt.io/ 
         // res.send('User registered');  // for testing only
      } catch (err) {
         console.error(err.message);
         res.status(500).send('Server error');
      }

   });

module.exports = router;
