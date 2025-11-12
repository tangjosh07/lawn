# LawnLink - Neighborhood Lawncare Service Platform

A web application that connects neighbors to form groups and find lawncare providers with group-based pricing.

## Features

- **User Authentication**: Register and login as either a homeowner or lawncare provider
- **Group Management**: Homeowners can create groups with neighbors and join existing groups
- **Dynamic Pricing**: Providers can create offers with pricing based on:
  - Number of homes (min/max range)
  - Area coverage
  - Amenities (mowing, edging, fertilizing, weed control, mulching, leaf removal)
- **Offer Browsing**: Homeowners can browse offers filtered by their group size
- **Real-time Chat**: Direct messaging between homeowners and providers to finalize deals

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3001
```

Note: The server runs on port 3001 by default. You can change this by setting the PORT environment variable.

## Usage

### For Homeowners:
1. Register/Login as a homeowner
2. Create a group with your neighbors or join an existing group
3. Browse available offers from lawncare providers
4. Click "Chat with Provider" to discuss details and finalize deals

### For Providers:
1. Register/Login as a provider
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
- **Storage**: In-memory (can be upgraded to database)

## Project Structure

```
lawnlink/
├── server.js          # Express server with API routes and Socket.io
├── index.html         # Main HTML file
├── app.js            # Frontend JavaScript
├── styles.css        # Styling
├── package.json      # Dependencies
└── README.md         # This file
```

## API Endpoints

- `POST /api/register` - Register new user
- `POST /api/login` - Login user
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

