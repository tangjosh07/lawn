// Vercel serverless function entry point
// This file is required because Vercel looks for functions in the /api directory
const app = require('../server');

// Export as a handler function for Vercel
module.exports = async (req, res) => {
  // Vercel passes req and res directly to Express
  return app(req, res);
};
