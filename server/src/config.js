const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: process.env.SERVER_ENV_PATH || path.join(__dirname, '..', '.env')
});

const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'kviznik-dev-secret',
  dbPath:
    process.env.DB_PATH ||
    path.join(process.cwd(), 'data', 'kviznik.db'),
  defaultAdmin: {
    username: process.env.ADMIN_USERNAME || 'teacher',
    password: process.env.ADMIN_PASSWORD || 'kviznik123'
  }
};

module.exports = config;