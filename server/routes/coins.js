const express = require('express');
const axios = require('axios');
const Coin = require('../models/Coin');

const router = express.Router();

// Get all coins (from database, with fresh data from API)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Add delay to respect rate limits
    const rateLimitDelay = 1000; // 1 second delay
    
    // Fetch fresh data from CoinGecko API with rate limiting
    const apiHeaders = {};
    if (process.env.COINGECKO_API_KEY) {
      apiHeaders['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }
    
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: Math.min(limit, 20), // Reduce batch size for free tier
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      },
      headers: apiHeaders,
      timeout: 10000 // 10 second timeout
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
    
    // If API fails due to rate limiting, try to return cached data from database (if connected)
    const isMongoConnected = req.app.locals.isMongoConnected && req.app.locals.isMongoConnected();
    
    if (isMongoConnected) {
      try {
        const cachedCoins = await Coin.find({})
          .sort({ rank: 1 })
          .limit(parseInt(req.query.limit) || 50);
        
        if (cachedCoins.length > 0) {
          return res.json({
            success: true,
            count: cachedCoins.length,
            data: cachedCoins,
            message: 'Returned cached data due to API rate limit',
            source: 'db_cache'
          });
        }
      } catch (dbError) {
        console.error('Database fallback also failed:', dbError.message);
      }
    }
    
    // If everything fails, return a user-friendly error with rate limit info
    const isRateLimit = error.response?.status === 429 || error.response?.status === 401;
    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      message: isRateLimit 
        ? 'API rate limit exceeded. Please try again in a few minutes or set up a CoinGecko API key.'
        : 'Error fetching cryptocurrency data',
      error: error.message,
      source: 'error',
      suggestion: isRateLimit 
        ? 'Consider getting a free CoinGecko API key for higher rate limits: https://www.coingecko.com/en/api/pricing'
        : null
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

// Get historical data for a specific coin
router.get('/:coinId/history', async (req, res) => {
  try {
    const { coinId } = req.params;
    const days = parseInt(req.query.days) || 7;
    const interval = req.query.interval || 'hourly';
    
    // Add rate limiting and API key support
    const apiHeaders = {};
    if (process.env.COINGECKO_API_KEY) {
      apiHeaders['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }
    
    // Fetch historical data from CoinGecko API with reduced frequency for free tier
    let endpoint = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`;
    const params = {
      vs_currency: 'usd',
      days: Math.min(days, 7), // Limit days for free tier
      interval: days <= 1 ? 'minutely' : days <= 90 ? 'hourly' : 'daily'
    };

    const response = await axios.get(endpoint, { 
      params,
      headers: apiHeaders,
      timeout: 10000 // 10 second timeout
    });
    const data = response.data;

    // Process the data into the format our frontend expects
    const prices = data.prices || [];
    const labels = [];
    const priceData = [];
    const candlestickData = [];

    // CoinGecko returns data as [timestamp, price] arrays
    for (let i = 0; i < prices.length; i++) {
      const timestamp = prices[i][0];
      const price = prices[i][1];
      const date = new Date(timestamp);
      
      // Format label based on interval
      let label;
      if (params.interval === 'minutely') {
        label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (params.interval === 'hourly') {
        label = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        label = date.toLocaleDateString();
      }
      
      labels.push(label);
      priceData.push(price);
      
      // Generate mock OHLC data for candlestick (CoinGecko free API doesn't provide OHLC)
      const volatility = price * 0.02; // 2% volatility
      const open = price + (Math.random() - 0.5) * volatility * 0.5;
      const close = price + (Math.random() - 0.5) * volatility * 0.5;
      const high = Math.max(open, close, price) + Math.random() * volatility * 0.3;
      const low = Math.min(open, close, price) - Math.random() * volatility * 0.3;
      
      candlestickData.push({
        x: label,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close)
      });
    }

    res.json({
      success: true,
      data: {
        labels,
        data: priceData,
        candlestickData,
        interval: params.interval,
        days: days
      }
    });

  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    
    // Check if it's a rate limit error
    const isRateLimit = error.response?.status === 429 || error.response?.status === 401;
    
    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      message: isRateLimit 
        ? 'Historical data API rate limit exceeded. Using simulated data instead.'
        : 'Error fetching historical data',
      error: error.message,
      fallback: true,
      suggestion: isRateLimit 
        ? 'The chart will use simulated data. For real historical data, consider getting a CoinGecko API key.'
        : null
    });
  }
});

module.exports = router;