import React, { useState, useEffect } from 'react';
import CoinTable from './components/CoinTable';
import PriceChart from './components/PriceChart';
import './index.css';

function App() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const fetchCoins = async () => {
    try {
      setError(null);
      const response = await fetch('/api/coins?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setCoins(data.data);
        if (!selectedCoin && data.data.length > 0) {
          setSelectedCoin(data.data[0]);
        }
        
        // Show rate limit message if using cached data
        if (data.source === 'db_cache' && data.message) {
          setError(data.message + ' (Using cached data)');
        }
      } else {
        const errorMessage = response.status === 429 
          ? 'API rate limit reached. Data updates may be limited. (Getting a CoinGecko API key cost at least 100$/month.)'
          : data.message || 'Failed to fetch coins';
        setError(errorMessage);
      }
    } catch (err) {
      setError('Failed to connect to server. Please check if the backend is running.');
      console.error('Error fetching coins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
    
    // Fetch data every 60 seconds
    const interval = setInterval(fetchCoins, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                📊 CryptoPulse
              </h1>
              <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-md">
                Live
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={fetchCoins}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄' : '↻'} Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className={`mb-6 border px-4 py-3 rounded-md ${
            error.includes('rate limit') || error.includes('cached data')
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <span className={error.includes('rate limit') || error.includes('cached data') ? 'text-yellow-400' : 'text-red-400'}>
                  {error.includes('rate limit') || error.includes('cached data') ? '⚠️' : '❌'}
                </span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  {error.includes('rate limit') || error.includes('cached data') ? 'API Rate Limit Notice' : 'Error'}
                </h3>
                <div className="mt-2 text-sm">{error}</div>
                {error.includes('rate limit') && (
                  <div className="mt-2 text-xs">
                    💡 To get unlimited API access, sign up for a free CoinGecko API key at{' '}
                    <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="underline">
                      coingecko.com/api
                    </a>{' '}
                    and add it to your server/.env file
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Price Chart */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Price Chart
                {selectedCoin && (
                  <span className="ml-2 text-gray-500">
                    ({selectedCoin.symbol.toUpperCase()})
                  </span>
                )}
              </h2>
              <PriceChart selectedCoin={selectedCoin} coins={coins} />
            </div>
          </div>

          {/* Market Stats */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Market Overview
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Coins</span>
                  <span className="font-semibold">{coins.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Top Gainer</span>
                  <span className="font-semibold text-success-600">
                    {coins.length > 0 && 
                      Math.max(...coins.map(c => c.change24h)).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Top Loser</span>
                  <span className="font-semibold text-danger-600">
                    {coins.length > 0 && 
                      Math.min(...coins.map(c => c.change24h)).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {selectedCoin && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedCoin.name}
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold">
                      ${selectedCoin.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">24h Change</span>
                    <span className={`font-semibold ${
                      selectedCoin.change24h >= 0 ? 'price-positive' : 'price-negative'
                    }`}>
                      {selectedCoin.change24h >= 0 ? '+' : ''}
                      {selectedCoin.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market Cap</span>
                    <span className="font-semibold">
                      ${(selectedCoin.marketCap / 1e9).toFixed(2)}B
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rank</span>
                    <span className="font-semibold">#{selectedCoin.rank}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coin Table */}
        <div className="mt-8">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Top Cryptocurrencies
              </h2>
            </div>
            <CoinTable 
              coins={coins} 
              loading={loading} 
              onCoinSelect={handleCoinSelect}
              selectedCoin={selectedCoin}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;