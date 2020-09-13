const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
   try {
      mongoose.set('useUnifiedTopology', true);  // this is newly added for Mongoose depracation warning
      await mongoose.connect(db, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false });
      // 'useFindAndModify: false' is added for Mongoose deprecation warning
      console.log('MongoDB Connected...');
   } catch (err) {
      console.error(err.message);
      process.exit(1);   // Exit process with failure.
   }
}

module.exports = connectDB;