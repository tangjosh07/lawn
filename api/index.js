// Vercel serverless function entry point
// This file is required because Vercel looks for functions in the /api directory
const app = require('../server');

// Export the Express app directly - Vercel handles it automatically
module.exports = app;
