# LawnLink - Neighborhood Lawncare Service Platform

A web application that connects neighbors to form groups and find lawncare providers with group-based pricing.

## Features

- **User Authentication**: Google OAuth login for seamless authentication
- **Group Management**: Homeowners can create groups with neighbors and join existing groups
- **Dynamic Pricing**: Providers can create offers with pricing based on:
  - Number of homes (min/max range)
  - Area coverage
  - Amenities (mowing, edging, fertilizing, weed control, mulching, leaf removal)
- **Offer Browsing**: Homeowners can browse offers filtered by their group size
- **Real-time Chat**: Direct messaging between homeowners and providers to finalize deals
- **Modern UI**: Clean, neighborly design with glassmorphism effects and smooth animations

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with your Google OAuth credentials:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
BASE_URL=http://localhost:3001
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3001
```

Note: The server runs on port 3001 by default. You can change this by setting the PORT environment variable.

## Usage

### For Homeowners:
1. Sign in with Google
2. Search for groups in your ZIP code or start a new group
3. Join a group to unlock discounts (3+ members = 10% off, 6+ = 20% off)
4. Browse available offers from lawncare providers
5. Chat with providers to finalize deals

### For Providers:
1. Sign in with Google
2. Create offers with:
   - Title and description
   - Minimum and maximum number of homes
   - Base price and price per home
   - Area coverage
   - Available amenities
3. Chat with interested homeowners to finalize deals

## Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Google OAuth 2.0
- **Storage**: In-memory (can be upgraded to database)

## Project Structure

```
lawnlink/
├── server.js          # Express server with API routes and Socket.io
├── index.html         # Main HTML file
├── assets/
│   ├── app.js        # Frontend JavaScript
│   └── styles.css    # Styling
├── package.json      # Dependencies
├── .env              # Environment variables (Google OAuth)
└── README.md         # This file
```

## API Endpoints

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/verify` - Verify authentication token
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group
- `POST /api/groups/:groupId/join` - Join a group
- `GET /api/offers` - Get offers (with optional filters)
- `POST /api/offers` - Create new offer
- `GET /api/messages/:userId/:otherUserId` - Get chat messages

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- Payment processing
- Reviews and ratings
- Email notifications
- Map integration for location-based matching
- Group scheduling and calendar

