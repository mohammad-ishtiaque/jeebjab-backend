import mongoose from "mongoose";
import config from "../config/index.js"; // .js extension দিতে ভুলবে না

/**
 * কেন এই পরিবর্তন: 
 * ১. moment ইমপোর্ট ডিলিট করা হয়েছে কারণ এটি এখানে ব্যবহৃত হচ্ছে না।
 * ২. require এর বদলে import ব্যবহার করা হয়েছে।
 */
const connectDB = async () => {
  try {
    if (!config.database_url) {
      throw new Error("❌ Database URL is missing in config!");
    }

    await mongoose.connect(config.database_url);
    
    console.log(`✅ DB connection successful! at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1); // কানেকশন না হলে সার্ভার বন্ধ করে দেওয়া ভালো
  }
};

export default connectDB;