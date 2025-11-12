const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  minHomes: {
    type: Number,
    required: true,
    min: 1
  },
  maxHomes: {
    type: Number,
    required: true,
    min: 1
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerHome: {
    type: Number,
    required: true,
    min: 0
  },
  areaCoverage: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{
    type: String,
    enum: ['mowing', 'edging', 'fertilizing', 'weed_control', 'mulching', 'leaf_removal']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Offer', offerSchema);

