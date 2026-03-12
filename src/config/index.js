import path from "path";
import dotenv from "dotenv";

// .env ফাইল লোড করা হচ্ছে
dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

/**
 * কেন এটি গুরুত্বপূর্ণ: সার্ভার রান হওয়ার আগেই চেক করা যে সব দরকারি চাবি (Keys) আছে কিনা।
 * একে বলা হয় 'Fail-Fast' মেকানিজম।
 */
const validateConfig = (conf) => {
  const requiredFields = [
    { name: "MONGO_URL", value: conf.database_url },
    { name: "JWT_SECRET", value: conf.jwt.secret },
    // { name: "STRIPE_SECRET_KEY", value: conf.stripe.stripe_secret_key },
  ];

  const missingFields = requiredFields
    .filter((field) => !field.value)
    .map((field) => field.name);

  if (missingFields.length > 0) {
    throw new Error(
      `❌ Configuration Error: Missing required environment variables: [${missingFields.join(", ")}]`
    );
  }
};

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10), // String থেকে Number-এ কনভার্ট এবং ডিফল্ট ৫০৫২
  base_url: process.env.BASE_URL,
  database_url: process.env.MONGO_URL,

  // RBAC (Role Based Access Control) Levels
  auth_level: {
    user: ["USER", "ADMIN", "SUPER_ADMIN"],
    admin: ["ADMIN", "SUPER_ADMIN"],
    super_admin: ["SUPER_ADMIN"],
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN || "1d",
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  smtp: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: parseInt(process.env.SMTP_PORT || "587", 10),
    smtp_service: process.env.SMTP_SERVICE,
    smtp_mail: process.env.SMTP_MAIL,
    smtp_password: process.env.SMTP_PASSWORD,
    NAME: process.env.SERVICE_NAME || "My App",
  },

  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    cloudinary_url: process.env.CLOUDINARY_URL,
  },

  stripe: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret_test: process.env.STRIPE_WEBHOOK_SECRET_TEST,
    stripe_webhook_secret_production: process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION,
  },

  variables: {
    email_temp_image: process.env.EMAIL_TEMP_IMAGE,
    email_temp_text_secondary_color: process.env.EMAIL_TEMP_TEXT_SECONDARY_COLOR || "#555555",
  },
};

// অ্যাপ চালু হওয়ার আগে কনফিগারেশন চেক
validateConfig(config);

export default config;