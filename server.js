// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const mongoose = require('mongoose');

// Database models
const User = require('./models/User');
const Group = require('./models/Group');
const Offer = require('./models/Offer');
const Message = require('./models/Message');

// Database connection
const connectDB = require('./db/connect');

const app = express();
// Only create server and socket.io if not in Vercel (serverless)
let server, io;
if (!process.env.VERCEL) {
  server = http.createServer(app);
  io = socketIo(server);
}

app.use(express.json());

// Determine the correct base path for static files
// In Vercel, __dirname points to /api, so we need to go up one level
const projectRoot = process.env.VERCEL ? path.join(__dirname, '..') : __dirname;
const staticPath = projectRoot;
const assetsPath = path.join(projectRoot, 'assets');

app.use(express.static(staticPath));
app.use('/assets', express.static(assetsPath));

// Serve index.html for root route
app.get('/', (req, res) => {
  try {
    const indexPath = path.join(projectRoot, 'index.html');
    console.log('Serving index.html from:', indexPath);
    console.log('Project root:', projectRoot);
    console.log('__dirname:', __dirname);
    console.log('process.cwd():', process.cwd());
    res.sendFile(indexPath);
  } catch (error) {
    console.error('Error serving index.html:', error);
    console.error('Project root:', projectRoot);
    console.error('__dirname:', __dirname);
    res.status(500).send('Error loading page: ' + error.message);
  }
});

// Google OAuth configuration
// Set these in environment variables or create a .env file
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// OAuth sessions (temporary, in-memory is fine)
const sessions = {};

// Initialize database connection
connectDB();

// Helper functions - use database or fallback to in-memory
const findUser = async (userId) => {
  if (mongoose.connection.readyState === 1) {
    return await User.findById(userId);
  }
  return null;
};

const findUserByEmail = async (email) => {
  if (mongoose.connection.readyState === 1) {
    return await User.findOne({ email: email.toLowerCase().trim() });
  }
  return null;
};

const findGroup = async (groupId) => {
  if (mongoose.connection.readyState === 1) {
    return await Group.findById(groupId).populate('members', 'name email picture');
  }
  return null;
};

const findOffer = async (offerId) => {
  if (mongoose.connection.readyState === 1) {
    return await Offer.findById(offerId).populate('providerId', 'name email');
  }
  return null;
};

// Authentication routes
app.post('/api/register', async (req, res) => {
  const { name, email, password, userType } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  
  try {
    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const user = new User({
      name,
      email: email.trim().toLowerCase(),
      password: password, // In production, hash passwords with bcrypt
      userType: userType || 'homeowner',
      authMethod: 'email'
    });
    
    await user.save();
    
    res.json({ 
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        userType: user.userType 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = Buffer.from(JSON.stringify({ userId: user._id.toString(), email: user.email })).toString('base64');
    res.json({ 
      token, 
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        userType: user.userType,
        picture: user.picture
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Helper function to get base URL from request
function getBaseUrl(req) {
  // Priority 1: Request headers (most reliable in Vercel)
  const protocol = req.headers['x-forwarded-proto'] || 
                   (req.secure ? 'https' : 'http') || 
                   'https';
  const host = req.headers['x-forwarded-host'] || 
               req.headers.host ||
               req.headers[':authority']; // HTTP/2 header
  
  if (host) {
    const url = `${protocol}://${host}`.replace(/\/$/, '');
    console.log('Using request headers - Base URL:', url);
    return url;
  }
  
  // Priority 2: Explicit BASE_URL env var
  if (process.env.BASE_URL) {
    const url = process.env.BASE_URL.replace(/\/$/, '');
    console.log('Using BASE_URL env var - Base URL:', url);
    return url;
  }
  
  // Priority 3: VERCEL_URL env var (Vercel provides this)
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
    console.log('Using VERCEL_URL env var - Base URL:', url);
    return url;
  }
  
  // Error in production - should never reach here
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const error = 'ERROR: Could not determine base URL! Headers: ' + JSON.stringify({
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'host': req.headers.host,
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'BASE_URL': process.env.BASE_URL,
      'VERCEL_URL': process.env.VERCEL_URL
    });
    console.error(error);
    throw new Error('Could not determine base URL in production');
  }
  
  // Only for local development
  console.warn('Local dev: Using localhost fallback');
  return 'http://localhost:3001';
}

// Google OAuth routes
app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.' });
  }
  
  const state = uuidv4();
  const baseUrl = getBaseUrl(req);
  // Ensure no trailing slash and correct path
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`;
  const scope = 'openid email profile';
  
  // Log for debugging
  console.log('=== OAuth Initiation ===');
  console.log('Final Base URL:', baseUrl);
  console.log('Final Redirect URI:', redirectUri);
  console.log('All headers:', JSON.stringify(req.headers, null, 2));
  
  // Store state for verification (sessions stay in-memory, they're temporary)
  sessions[state] = {
    createdAt: Date.now(),
    userType: req.query.userType || 'homeowner'
  };
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  res.redirect(authUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code || !state) {
    return res.redirect(`/?error=oauth_failed`);
  }
  
  // Verify state
  const session = sessions[state];
  if (!session) {
    return res.redirect(`/?error=invalid_state`);
  }
  
  // Clean up old sessions (older than 10 minutes)
  const now = Date.now();
  Object.keys(sessions).forEach(key => {
    if (now - sessions[key].createdAt > 600000) {
      delete sessions[key];
    }
  });
  
  try {
    // Exchange code for tokens (Google expects form-encoded data)
    const baseUrl = getBaseUrl(req);
    // Ensure no trailing slash and correct path
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`;
    const tokenData = {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };
    
    // Log for debugging
    console.log('Callback redirect URI:', redirectUri);
    
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', 
      new URLSearchParams(tokenData).toString(), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    const { id: googleId, email, name, picture } = userResponse.data;
    const normalizedEmail = email.toLowerCase();
    
    // Find or create user
    let user = await findUserByEmail(normalizedEmail);
    
    if (!user && mongoose.connection.readyState === 1) {
      // Check if user exists by Google ID
      user = await User.findOne({ googleId });
    }
    
    if (!user) {
      // Create new user
      user = new User({
        name: name || email.split('@')[0],
        email: normalizedEmail,
        googleId: googleId,
        picture: picture,
        userType: session.userType || 'homeowner',
        authMethod: 'google'
      });
      await user.save();
    } else {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.picture) {
        user.picture = picture;
      }
      user.authMethod = 'google';
      await user.save();
    }
    
    // Clean up session
    delete sessions[state];
    
    // Redirect to frontend with token (in production, use secure httpOnly cookies)
    const token = Buffer.from(JSON.stringify({ userId: user._id.toString(), email: user.email })).toString('base64');
    const baseUrl = getBaseUrl(req);
    res.redirect(`${baseUrl}/?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: user._id.toString(), name: user.name, email: user.email, userType: user.userType, picture: user.picture }))}`);
    
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(`/?error=oauth_error`);
  }
});

// Verify token endpoint
app.get('/api/auth/verify', async (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = await findUser(decoded.userId);
    
    if (!user || user.email !== decoded.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ 
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        userType: user.userType, 
        picture: user.picture 
      } 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Group routes
app.get('/api/groups', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const groups = await Group.find()
        .populate('members', 'name email picture')
        .populate('createdBy', 'name email')
        .lean();
      
      // Transform to match frontend expectations
      const transformedGroups = groups.map(group => ({
        id: group._id.toString(),
        name: group.name,
        zip: group.zip,
        address: group.address,
        members: group.members ? group.members.length : 0,
        memberDetails: group.members || []
      }));
      
      res.json(transformedGroups);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

app.post('/api/groups', async (req, res) => {
  const { name, address, zip, creatorId } = req.body;
  
  if (!name || !creatorId) {
    return res.status(400).json({ error: 'Name and creator ID are required' });
  }
  
  try {
    // Extract ZIP from address if not provided
    let groupZip = zip;
    if (!groupZip && address) {
      const zipMatch = address.match(/\b\d{5}\b/);
      if (zipMatch) groupZip = zipMatch[0];
    }
    
    if (!groupZip) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }
    
    // Verify creator exists
    const creator = await findUser(creatorId);
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    const group = new Group({
      name,
      address: address || '',
      zip: groupZip,
      createdBy: creatorId,
      members: [creatorId] // Creator is first member
    });
    
    await group.save();
    await group.populate('members', 'name email picture');
    await group.populate('createdBy', 'name email');
    
    res.json({
      id: group._id.toString(),
      name: group.name,
      zip: group.zip,
      address: group.address,
      members: group.members ? group.members.length : 1,
      memberDetails: group.members || []
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.post('/api/groups/:groupId/join', async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  try {
    const group = await findGroup(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is already a member
    const memberIds = group.members.map(m => m._id ? m._id.toString() : m.toString());
    if (!memberIds.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    
    await group.populate('members', 'name email picture');
    
    res.json({
      id: group._id.toString(),
      name: group.name,
      zip: group.zip,
      address: group.address,
      members: group.members ? group.members.length : 0,
      memberDetails: group.members || []
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

app.get('/api/groups/:groupId', async (req, res) => {
  try {
    const group = await findGroup(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json({
      id: group._id.toString(),
      name: group.name,
      zip: group.zip,
      address: group.address,
      members: group.members ? group.members.length : 0,
      memberDetails: group.members || []
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Offer routes
app.get('/api/offers', async (req, res) => {
  const { groupId, minHomes, maxHomes } = req.query;
  
  try {
    let offers = [];
    if (mongoose.connection.readyState === 1) {
      offers = await Offer.find()
        .populate('providerId', 'name email picture')
        .lean();
    }
  
    // Transform to match frontend expectations
    let transformedOffers = offers.map(offer => ({
      id: offer._id.toString(),
      providerId: offer.providerId._id ? offer.providerId._id.toString() : offer.providerId.toString(),
      title: offer.title,
      description: offer.description,
      minHomes: offer.minHomes,
      maxHomes: offer.maxHomes,
      basePrice: offer.basePrice,
      pricePerHome: offer.pricePerHome,
      amenities: offer.amenities,
      areaCoverage: offer.areaCoverage,
      createdAt: offer.createdAt
    }));
    
    // Filter by group size if groupId provided
    if (groupId) {
      const group = await findGroup(groupId);
      if (group) {
        const homeCount = group.members ? group.members.length : 0;
        transformedOffers = transformedOffers.filter(o => 
          o.minHomes <= homeCount && o.maxHomes >= homeCount
        );
      }
    }
    
    // Filter by min/max homes
    if (minHomes) {
      transformedOffers = transformedOffers.filter(o => o.maxHomes >= parseInt(minHomes));
    }
    
    if (maxHomes) {
      transformedOffers = transformedOffers.filter(o => o.minHomes <= parseInt(maxHomes));
    }
    
    res.json(transformedOffers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

app.post('/api/offers', async (req, res) => {
  const { providerId, title, description, minHomes, maxHomes, basePrice, pricePerHome, amenities, areaCoverage } = req.body;
  
  if (!providerId || !title) {
    return res.status(400).json({ error: 'Provider ID and title are required' });
  }
  
  try {
    // Verify provider exists
    const provider = await findUser(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const offer = new Offer({
      providerId,
      title,
      description: description || '',
      minHomes: parseInt(minHomes) || 1,
      maxHomes: parseInt(maxHomes) || 100,
      basePrice: parseFloat(basePrice) || 0,
      pricePerHome: parseFloat(pricePerHome) || 0,
      amenities: amenities || [],
      areaCoverage: parseFloat(areaCoverage) || 0
    });
    
    await offer.save();
    await offer.populate('providerId', 'name email picture');
    
    res.json({
      id: offer._id.toString(),
      providerId: offer.providerId._id.toString(),
      title: offer.title,
      description: offer.description,
      minHomes: offer.minHomes,
      maxHomes: offer.maxHomes,
      basePrice: offer.basePrice,
      pricePerHome: offer.pricePerHome,
      amenities: offer.amenities,
      areaCoverage: offer.areaCoverage,
      createdAt: offer.createdAt
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

app.get('/api/offers/:offerId', async (req, res) => {
  try {
    const offer = await findOffer(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json({
      id: offer._id.toString(),
      providerId: offer.providerId._id ? offer.providerId._id.toString() : offer.providerId.toString(),
      title: offer.title,
      description: offer.description,
      minHomes: offer.minHomes,
      maxHomes: offer.maxHomes,
      basePrice: offer.basePrice,
      pricePerHome: offer.pricePerHome,
      amenities: offer.amenities,
      areaCoverage: offer.areaCoverage,
      createdAt: offer.createdAt
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
});

// Message routes
app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
  const { userId, otherUserId } = req.params;
  
  try {
    let messages = [];
    if (mongoose.connection.readyState === 1) {
      messages = await Message.find({
        $or: [
          { fromId: userId, toId: otherUserId },
          { fromId: otherUserId, toId: userId }
        ]
      })
      .populate('fromId', 'name email picture')
      .populate('toId', 'name email picture')
      .sort({ createdAt: 1 })
      .lean();
    }
    
    // Transform to match frontend expectations
    const transformedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      fromId: msg.fromId._id ? msg.fromId._id.toString() : msg.fromId.toString(),
      toId: msg.toId._id ? msg.toId._id.toString() : msg.toId.toString(),
      content: msg.content,
      offerId: msg.offerId ? msg.offerId.toString() : null,
      createdAt: msg.createdAt
    }));
    
    res.json(transformedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Socket.io for real-time chat (only if not in Vercel)
if (io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-room', (userId) => {
      socket.join(`user-${userId}`);
    });
    
    socket.on('send-message', async (messageData) => {
      try {
        // Save message to database
        let message;
        if (mongoose.connection.readyState === 1) {
          message = new Message({
            fromId: messageData.fromId,
            toId: messageData.toId,
            content: messageData.content,
            offerId: messageData.offerId || null
          });
          await message.save();
          await message.populate('fromId', 'name email picture');
          await message.populate('toId', 'name email picture');
          
          // Transform for socket emission
          const messageObj = {
            id: message._id.toString(),
            fromId: message.fromId._id.toString(),
            toId: message.toId._id.toString(),
            content: message.content,
            offerId: message.offerId ? message.offerId.toString() : null,
            createdAt: message.createdAt
          };
          
          // Send to both users
          io.to(`user-${messageData.toId}`).emit('receive-message', messageObj);
          io.to(`user-${messageData.fromId}`).emit('receive-message', messageObj);
        } else {
          // Fallback to in-memory if DB not available
          const messageObj = {
            id: uuidv4(),
            fromId: messageData.fromId,
            toId: messageData.toId,
            content: messageData.content,
            createdAt: new Date().toISOString()
          };
          io.to(`user-${messageData.toId}`).emit('receive-message', messageObj);
          io.to(`user-${messageData.fromId}`).emit('receive-message', messageObj);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

// Only start server for local development
if (!process.env.VERCEL && server) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless (always export, but only start server locally)
module.exports = app;

