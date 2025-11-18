const bcrypt = require("bcryptjs");

const hashPassword = (password) => bcrypt.hashSync(password, 10);
const verifyPassword = (password, hash) => bcrypt.compareSync(password, hash);

module.exports = {
  hashPassword,
  verifyPassword
};