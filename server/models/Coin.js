const mongoose = require('mongoose');

const coinSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  coinGeckoId: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  marketCap: {
    type: Number,
    required: true,
    min: 0
  },
  change24h: {
    type: Number,
    required: true
  },
  volume24h: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
coinSchema.index({ rank: 1 });
coinSchema.index({ symbol: 1 });
coinSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('Coin', coinSchema);