// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Google OAuth configuration
// Set these in environment variables or create a .env file
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Auto-detect BASE_URL from Vercel or use environment variable
const BASE_URL = process.env.BASE_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

// In-memory data storage (can be upgraded to database)
const data = {
  users: [],
  groups: [],
  offers: [],
  messages: [],
  sessions: {} // Store OAuth sessions temporarily
};

// Helper functions
const findUser = (userId) => data.users.find(u => u.id === userId);
const findGroup = (groupId) => data.groups.find(g => g.id === groupId);
const findOffer = (offerId) => data.offers.find(o => o.id === offerId);

// Authentication routes
app.post('/api/register', (req, res) => {
  const { name, email, password, userType } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  
  if (data.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  
  const user = {
    id: uuidv4(),
    name,
    email: email.trim().toLowerCase(),
    password: password, // In production, hash passwords
    userType: userType || 'homeowner', // 'homeowner' or 'provider'
    createdAt: new Date().toISOString()
  };
  
  data.users.push(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email, userType: user.userType } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  const user = data.users.find(u => u.email === normalizedEmail);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ user: { id: user.id, name: user.name, email: user.email, userType: user.userType } });
});

// Helper function to get base URL from request
function getBaseUrl(req) {
  // Use explicit BASE_URL env var first
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  // Use Vercel URL if available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to request headers (for Vercel and other platforms)
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3001';
  return `${protocol}://${host}`;
}

// Google OAuth routes
app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.' });
  }
  
  const state = uuidv4();
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const scope = 'openid email profile';
  
  // Store state for verification
  data.sessions[state] = {
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
  const session = data.sessions[state];
  if (!session) {
    return res.redirect(`/?error=invalid_state`);
  }
  
  // Clean up old sessions (older than 10 minutes)
  const now = Date.now();
  Object.keys(data.sessions).forEach(key => {
    if (now - data.sessions[key].createdAt > 600000) {
      delete data.sessions[key];
    }
  });
  
  try {
    // Exchange code for tokens (Google expects form-encoded data)
    const baseUrl = getBaseUrl(req);
    const tokenData = {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${baseUrl}/api/auth/google/callback`,
      grant_type: 'authorization_code'
    };
    
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
    let user = data.users.find(u => u.email === normalizedEmail || u.googleId === googleId);
    
    if (!user) {
      // Create new user
      user = {
        id: uuidv4(),
        name: name || email.split('@')[0],
        email: normalizedEmail,
        googleId: googleId,
        picture: picture,
        userType: session.userType || 'homeowner',
        createdAt: new Date().toISOString(),
        authMethod: 'google'
      };
      data.users.push(user);
    } else {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.picture) {
        user.picture = picture;
      }
      user.authMethod = 'google';
    }
    
    // Clean up session
    delete data.sessions[state];
    
    // Redirect to frontend with token (in production, use secure httpOnly cookies)
    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
    res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email, userType: user.userType, picture: user.picture }))}`);
    
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(`/?error=oauth_error`);
  }
});

// Verify token endpoint
app.get('/api/auth/verify', (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = data.users.find(u => u.id === decoded.userId && u.email === decoded.email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ user: { id: user.id, name: user.name, email: user.email, userType: user.userType, picture: user.picture } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Group routes
app.get('/api/groups', (req, res) => {
  res.json(data.groups);
});

app.post('/api/groups', (req, res) => {
  const { name, description, creatorId, address, area, zip } = req.body;
  
  // Extract ZIP from address if not provided
  let groupZip = zip;
  if (!groupZip && address) {
    const zipMatch = address.match(/\b\d{5}\b/);
    if (zipMatch) groupZip = zipMatch[0];
  }
  
  const group = {
    id: uuidv4(),
    name,
    description,
    creatorId,
    address,
    zip: groupZip || '',
    area: parseFloat(area) || 0,
    members: creatorId ? [creatorId] : [],
    createdAt: new Date().toISOString()
  };
  
  data.groups.push(group);
  res.json(group);
});

app.post('/api/groups/:groupId/join', (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  
  const group = findGroup(groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  if (!group.members.includes(userId)) {
    group.members.push(userId);
  }
  
  res.json(group);
});

app.get('/api/groups/:groupId', (req, res) => {
  const group = findGroup(req.params.groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  res.json(group);
});

// Offer routes
app.get('/api/offers', (req, res) => {
  const { groupId, minHomes, maxHomes } = req.query;
  let offers = data.offers;
  
  if (groupId) {
    const group = findGroup(groupId);
    if (group) {
      const homeCount = group.members.length;
      offers = offers.filter(o => 
        o.minHomes <= homeCount && o.maxHomes >= homeCount
      );
    }
  }
  
  if (minHomes) {
    offers = offers.filter(o => o.maxHomes >= parseInt(minHomes));
  }
  
  if (maxHomes) {
    offers = offers.filter(o => o.minHomes <= parseInt(maxHomes));
  }
  
  res.json(offers);
});

app.post('/api/offers', (req, res) => {
  const { providerId, title, description, minHomes, maxHomes, basePrice, pricePerHome, amenities, areaCoverage } = req.body;
  
  const offer = {
    id: uuidv4(),
    providerId,
    title,
    description,
    minHomes: parseInt(minHomes) || 1,
    maxHomes: parseInt(maxHomes) || 100,
    basePrice: parseFloat(basePrice) || 0,
    pricePerHome: parseFloat(pricePerHome) || 0,
    amenities: amenities || [],
    areaCoverage: parseFloat(areaCoverage) || 0,
    createdAt: new Date().toISOString()
  };
  
  data.offers.push(offer);
  res.json(offer);
});

app.get('/api/offers/:offerId', (req, res) => {
  const offer = findOffer(req.params.offerId);
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found' });
  }
  res.json(offer);
});

// Message routes
app.get('/api/messages/:userId/:otherUserId', (req, res) => {
  const { userId, otherUserId } = req.params;
  const messages = data.messages.filter(m => 
    (m.fromId === userId && m.toId === otherUserId) ||
    (m.fromId === otherUserId && m.toId === userId)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  res.json(messages);
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  socket.on('send-message', (messageData) => {
    const message = {
      id: uuidv4(),
      fromId: messageData.fromId,
      toId: messageData.toId,
      content: messageData.content,
      createdAt: new Date().toISOString()
    };
    
    data.messages.push(message);
    
    // Send to both users
    io.to(`user-${messageData.toId}`).emit('receive-message', message);
    io.to(`user-${messageData.fromId}`).emit('receive-message', message);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

