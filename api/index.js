// Vercel serverless function entry point
// This file is required because Vercel looks for functions in the /api directory
const app = require('../server');

// Export the app as a serverless function
module.exports = (req, res) => {
  return app(req, res);
};
