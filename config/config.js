
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  dbUser: process.env.DB_USER || 'postgres',
  dbHost: process.env.DB_HOST || 'localhost',
  dbName: process.env.DB_NAME || 'realestate_db',
  dbPassword: process.env.DB_PASSWORD || 'your_password',
  dbPort: process.env.DB_PORT || 5432,
  dialect: 'postgres',
};
