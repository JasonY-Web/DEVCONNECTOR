const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');  // validation middleware

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    GET api/profile/me
// @desc     Get current users profile using profile ID
// @access   Private
router.get('/me', auth, async (req, res) => {   // auth here is just to make it a protected route
   try {
      const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']); // copy the profile
      if (!profile) { return res.status(400).json({ msg: 'There is no profile for this user' }); } // see if it exists
      res.json(profile);  // show it if it does exist
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post('/',
   [auth, [check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills is required').not().isEmpty()],],
   // inside the [] is an array of validation middlewares: auth & validation middleware. check() has status and the message
   async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body;   // pull out all the fields from the req.body, which is sent from web front end?
      // build profile object
      const profileFields = {};
      profileFields.user = req.user.id;
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (bio) profileFields.bio = bio;
      if (status) profileFields.status = status;
      if (githubusername) profileFields.githubusername = githubusername;
      if (skills) { profileFields.skills = skills.split(',').map((skill) => skill.trim()); }
      // trim() is to trim off any space before or after each item in the array, which is converted to from an object.

      // Build social object
      profileFields.social = {};
      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (facebook) profileFields.social.facebook = facebook;
      if (linkedin) profileFields.social.linkedin = linkedin;
      if (instagram) profileFields.social.instagram = instagram;

      try {
         let profile = await Profile.findOne({ user: req.user.id });  //user.id comes from the token
         if (profile) {  // if profile found, then update it
            console.log(req.user.id);
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
            return res.json(profile);
         }
         profile = new Profile(profileFields); await profile.save(); res.json(profile);// send back to front end
         // if profile not found, then create a new one.

      } catch (err) {
         console.error(err.message);
         res.status(500).send('Server Error');
      }

      console.log(profileFields.social.twitter);  // to check the 'skills' is working
      res.send('Hello');  // to check in postman this part is working
   }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
   try {
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
})

// @route    GET api/profile/user/:user_id (here : is a place holder, so you can pass the user_id in the URL)
// @desc     Get profile by user ID (in the URL)
// @access   Public
router.get('/user/:user_id', async (req, res) => {
   try {
      const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
      if (!profile) return res.status(400).json({ msg: 'Profile not found' });
      res.json(profile);
   } catch (err) {
      console.error(err.message);
      if (err.kind == 'ObjectId') {
         return res.status(400).json({ msg: 'Profile not found' });
      }
      res.status(500).send('Server Error');
   }
});

// @route    DELETE api/profile
// @desc     Get profile, user, and posts.
// @access   Private
router.delete('/', auth, async (req, res) => {
   try {
      await Profile.findOneAndRemove({ user: req.user.id });  // remove profile
      await User.findOneAndRemove({ _id: req.user.id });   // remove user
      res.json({ msg: 'User deleted' });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
});

// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put('/experience', [auth,
   [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
   ]],
   async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }
      const { title, company, location, from, to, current, description } = req.body;
      const newExp = { title, company, location, from, to, current, description }
      try {
         const profile = await Profile.findOne({ user: req.user.id });
         profile.experience.unshift(newExp);  // 'unshift' is similar than 'push' except this pushes it onto the beginning (not the end) of an array.
         await profile.save();
         res.json(profile);  // for later React frontend.
      } catch (err) {
         console.error(err.message);
         res.status(500).send('Server Error');
      }
   }
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete profile experience from profile
// @access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
   try {
      const profile = await Profile.findOne({ user: req.user.id });
      const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
      profile.experience.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
});


// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put('/education', [auth,
   [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
   ]],
   async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }
      const { school, degree, fieldofstudy, from, to, current, description } = req.body;
      const newEdu = { school, degree, fieldofstudy, from, to, current, description }
      try {
         const profile = await Profile.findOne({ user: req.user.id });
         profile.education.unshift(newEdu);
         await profile.save();
         res.json(profile);  // for later React frontend.
      } catch (err) {
         console.error(err.message);
         res.status(500).send('Server Error');
      }
   }
);

// @route    DELETE api/profile/education/:exp_id
// @desc     Delete profile education from profile
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
   try {
      const profile = await Profile.findOne({ user: req.user.id });
      const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
      profile.education.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from github
// @access   Public
router.get('github/:username', (req, res) => {
   try {
      const options = {
         uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
         method: 'GET',
         headers: { 'user-agent': 'node.js' }
      };
      request(options, (error, response, body) => {
         if (error) console.error(error);
         if (response.statusCode !== 200) {
            return res.status(404).json({ msg: 'No Github profile found' });
         }
         res.json(JSON.parse(body));
      });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
})

module.exports = router;
