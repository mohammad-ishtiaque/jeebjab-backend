import crypto from "crypto"; // Node.js built-in module

/**
 * Generates a cryptographically secure 6-digit code.
 * @param {number} timeInMinutes - Expiration time in minutes (default is 5).
 */
const codeGenerator = (timeInMinutes = 5) => {
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiredAt = Date.now() + timeInMinutes * 60 * 1000;
  
  return { code, expiredAt };
};

export default codeGenerator;