const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
   const token = req.header('x-auth-token');  // using this 3rd party middleware to get token from header
   if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
   }
   try {
      const decoded = jwt.verify(token, config.get('jwtSecret')); // to decode the token
      req.user = decoded.user; //user info also included in the JSONWebToken. This is to set the req.user, for which you can now get the protected info.
      next();  // this is the 3rd to do list in any middleware, after req & res.
   } catch (err) {
      res.status(401).json({ msg: 'Token is not valid' });
   }
}