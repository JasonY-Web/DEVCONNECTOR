const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route    GET api/auth
// @desc     Test route
// @access   Public
router.get('/', auth, async (req, res) => {   // the 'auth' here will make the route protected
   // res.send('Auth route')  // for testing only
   try {
      const user = await (await User.findById(req.user.id)).isSelected('-password');
      // this req.user if from the auth.js in middleware. Here '-password' means we do not need it.
      res.json(user);  // once get the user id, then we get all the user data, e.g. who logged in.
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
router.post('/',   // below the whole code is very similar than the same named function in users.js, but here is used for user log in validation
   [
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password is required').exists()
   ],
   async (req, res) => {
      console.log(req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;
      try {
         let user = await User.findOne({ email });  // see if user exists
         if (!user) {  // return error message if the user does not exist
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
         }
         const isMatch = await bcrypt.compare(password, user.password);
         if (!isMatch) {  // return error message if the user email is wrong
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
         }

         const payload = { user: { id: user.id } }   // MDB use _id, but with Mongoose interface you can use .id

         jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 36000 },
            (err, token) => { if (err) throw err; res.json({ token }); });
         // if don't get error, then return JSONwebtoken back to the client. 
      } catch (err) {
         console.error(err.message);
         res.status(500).send('Server error');
      }

   });

module.exports = router;
