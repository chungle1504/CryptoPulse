const express = require('express');
const axios = require('axios');
const Coin = require('../models/Coin');

const router = express.Router();

// Get all coins (from database, with fresh data from API)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Fetch fresh data from CoinGecko API
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });

    const apiCoins = response.data;
    const updatedCoins = [];

    // Check if MongoDB is connected via app.locals
    const isMongoConnected = req.app.locals.isMongoConnected && req.app.locals.isMongoConnected();

    // Update or create coins in database (with fallback)
    for (const apiCoin of apiCoins) {
      const coinData = {
        name: apiCoin.name,
        symbol: apiCoin.symbol,
        coinGeckoId: apiCoin.id,
        price: apiCoin.current_price || 0,
        marketCap: apiCoin.market_cap || 0,
        change24h: apiCoin.price_change_percentage_24h || 0,
        volume24h: apiCoin.total_volume || 0,
        rank: apiCoin.market_cap_rank || 0,
        image: apiCoin.image || '',
        lastUpdated: new Date()
      };

      if (isMongoConnected) {
        try {
          const coin = await Coin.findOneAndUpdate(
            { coinGeckoId: apiCoin.id },
            coinData,
            { 
              new: true, 
              upsert: true,
              runValidators: true 
            }
          );
          updatedCoins.push(coin);
        } catch (dbError) {
          // If database operation fails, use API data directly
          console.warn('Database operation failed, using API data:', dbError.message);
          updatedCoins.push({
            ...coinData,
            _id: apiCoin.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } else {
        // No database connection, use API data directly
        updatedCoins.push({
          ...coinData,
          _id: apiCoin.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    res.json({
      success: true,
      count: updatedCoins.length,
      data: updatedCoins,
      source: isMongoConnected ? 'api_with_db' : 'api_only'
    });

  } catch (error) {
    console.error('Error fetching coins:', error.message);
    
    // If API fails, try to return cached data from database (if connected)
    const isMongoConnected = req.app.locals.isMongoConnected && req.app.locals.isMongoConnected();
    
    if (isMongoConnected) {
      try {
        const cachedCoins = await Coin.find({})
          .sort({ rank: 1 })
          .limit(parseInt(req.query.limit) || 50);
        
        res.json({
          success: true,
          count: cachedCoins.length,
          data: cachedCoins,
          message: 'Returned cached data due to API error',
          source: 'db_cache'
        });
        return;
      } catch (dbError) {
        console.error('Database fallback also failed:', dbError.message);
      }
    }
    
    // If everything fails, return error
    res.status(500).json({
      success: false,
      message: 'Error fetching cryptocurrency data',
      error: error.message,
      source: 'error'
    });
  }
});

// Get specific coin by symbol or coinGeckoId
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const coin = await Coin.findOne({
      $or: [
        { symbol: identifier.toUpperCase() },
        { coinGeckoId: identifier.toLowerCase() }
      ]
    });

    if (!coin) {
      return res.status(404).json({
        success: false,
        message: 'Coin not found'
      });
    }

    res.json({
      success: true,
      data: coin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coin data',
      error: error.message
    });
  }
});

// Get trending coins (top gainers in 24h)
router.get('/trending/gainers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const trendingCoins = await Coin.find({ change24h: { $gt: 0 } })
      .sort({ change24h: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: trendingCoins.length,
      data: trendingCoins
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trending coins',
      error: error.message
    });
  }
});

module.exports = router;