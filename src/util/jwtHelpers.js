import jwt from "jsonwebtoken";

/**
 * Creates a signed JWT token.
 * @param {object} payload - Data to encode (userId, role, etc.)
 * @param {string} secret - Secret key for signing
 * @param {string} expireTime - Expiry duration e.g. "7d", "1h"
 */
const createToken = (payload, secret, expireTime) => {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: expireTime,
  });
};

/**
 * Verifies a JWT token and returns decoded payload.
 * Throws JsonWebTokenError if invalid.
 * Throws TokenExpiredError if expired.
 * @param {string} token
 * @param {string} secret
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

const jwtHelpers = {
  createToken,
  verifyToken,
};

export default jwtHelpers;