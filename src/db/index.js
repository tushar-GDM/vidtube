import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
  try {
    const result = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`Database connected: ${result.connection.host}`);
    
    //console.log(`Connected to database: ${DB_NAME}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

export default connectDB;