const jwt = require("jsonwebtoken");
const config = require("../config");

const generateToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: "12h" });

const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

module.exports = {
  generateToken,
  verifyToken
};