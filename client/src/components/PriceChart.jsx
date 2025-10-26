import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ selectedCoin, coins }) => {
  const chartRef = useRef();
  const [chartType, setChartType] = useState('line'); // 'line' or 'candlestick'
  const [interval, setInterval] = useState('1h'); // '1m', '15m', '1h', '4h', '1d'
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(false);

  const intervals = [
    { value: '1m', label: '1m', points: 60 },
    { value: '15m', label: '15m', points: 60 }, // 24 hours
    { value: '1h', label: '1h', points: 60 }, // 7 days
    { value: '4h', label: '4h', points: 60 }, // 30 days
    { value: '1d', label: '1d', points: 60 } // 1 year
  ];

  // Fetch real historical data from CoinGecko
  const fetchHistoricalData = async (coinId, timeInterval) => {
    if (!coinId) return null;
    
    setLoading(true);
    try {
      let days, interval_param;
      
      switch (timeInterval) {
        case '1m':
          days = 1;
          interval_param = 'minutely';
          break;
        case '15m':
          days = 1;
          interval_param = 'minutely';
          break;
        case '1h':
          days = 7;
          interval_param = 'hourly';
          break;
        case '4h':
          days = 7; // Reduced from 30 days
          interval_param = 'hourly';
          break;
        case '1d':
          days = 30; // Reduced from 365 days
          interval_param = 'daily';
          break;
        default:
          days = 7;
          interval_param = 'hourly';
      }

      const response = await fetch(`/api/coins/${coinId}/history?days=${days}&interval=${interval_param}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        // If API fails (rate limit), use mock data
        console.warn('API failed, using mock data:', data.message);
        return generateMockData(selectedCoin, timeInterval);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return generateMockData(selectedCoin, timeInterval);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock historical data for demonstration
  const generateMockData = (coin, timeInterval) => {
    if (!coin) return { labels: [], data: [], candlestickData: [] };

    const labels = [];
    const data = [];
    const candlestickData = [];
    const now = new Date();
    const currentPrice = coin.price;
    const change24h = coin.change24h;

    const intervalConfig = intervals.find(i => i.value === timeInterval);
    const points = intervalConfig ? intervalConfig.points : 24;
    
    let timeIncrement;
    switch (timeInterval) {
      case '1m':
        timeIncrement = 60 * 1000; // 1 minute
        break;
      case '15m':
        timeIncrement = 15 * 60 * 1000; // 15 minutes
        break;
      case '1h':
        timeIncrement = 60 * 60 * 1000; // 1 hour
        break;
      case '4h':
        timeIncrement = 4 * 60 * 60 * 1000; // 4 hours
        break;
      case '1d':
        timeIncrement = 24 * 60 * 60 * 1000; // 1 day
        break;
      default:
        timeIncrement = 60 * 60 * 1000; // 1 hour
    }

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * timeIncrement);
      
      // Format time based on interval
      let timeLabel;
      if (timeInterval === '1m' || timeInterval === '15m') {
        timeLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeInterval === '1h' || timeInterval === '4h') {
        timeLabel = time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeLabel = time.toLocaleDateString();
      }
      
      labels.push(timeLabel);
      
      // Simulate price movement
      const progress = (points - 1 - i) / (points - 1);
      const baseVariation = (Math.random() - 0.5) * 0.05; // ±2.5% random variation
      const trendVariation = (change24h / 100) * progress; // Apply 24h change over time
      const priceAtTime = currentPrice * (1 + baseVariation + trendVariation);
      
      data.push(Math.max(0, priceAtTime));
      
      // Generate candlestick data (OHLC)
      const basePrice = Math.max(0, priceAtTime);
      const volatility = basePrice * 0.02; // 2% volatility
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = basePrice + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      candlestickData.push({
        x: timeLabel,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close)
      });
    }

    return { labels, data, candlestickData };
  };

  // Update data when coin or interval changes
  useEffect(() => {
    if (selectedCoin) {
      fetchHistoricalData(selectedCoin.coinGeckoId, interval).then(data => {
        setHistoricalData(data);
      });
    }
  }, [selectedCoin, interval]);

  // Get chart data based on current state
  const getChartData = () => {
    const data = historicalData || generateMockData(selectedCoin, interval);
    
    if (chartType === 'line') {
      return {
        labels: data.labels,
        datasets: [
          {
            label: selectedCoin ? `${selectedCoin.name} Price (USD)` : 'Price',
            data: data.data,
            borderColor: selectedCoin?.change24h >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)',
            backgroundColor: selectedCoin?.change24h >= 0 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderWidth: 2,
            pointHoverBorderColor: '#fff',
          },
        ],
      };
    } else {
      // Candlestick chart using bar chart with custom styling
      const candlestickData = data.candlestickData || [];
      return {
        labels: data.labels,
        datasets: [
          {
            label: 'High',
            data: candlestickData.map(item => item.high),
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,0,0,0.3)',
            borderWidth: 1,
            type: 'line',
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Low',
            data: candlestickData.map(item => item.low),
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,0,0,0.3)',
            borderWidth: 1,
            type: 'line',
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Open-Close',
            data: candlestickData.map(item => [item.low, item.high]),
            backgroundColor: candlestickData.map(item => 
              item.close >= item.open ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
            ),
            borderColor: candlestickData.map(item => 
              item.close >= item.open ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
            ),
            borderWidth: 2,
            barThickness: 'flex',
            maxBarThickness: 8,
          }
        ],
      };
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const price = context.parsed.y;
            return `Price: $${price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return value < 1 
              ? `$${value.toFixed(6)}` 
              : `$${value.toLocaleString()}`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  if (!selectedCoin) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coin selected</h3>
          <p>Select a cryptocurrency from the table to view its price chart.</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  if (loading || !chartData || chartData.labels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Chart Header */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {selectedCoin.image && (
              <img
                src={selectedCoin.image}
                alt={selectedCoin.name}
                className="h-10 w-10 rounded-full"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCoin.name}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedCoin.symbol.toUpperCase()} • Rank #{selectedCoin.rank}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${selectedCoin.price < 1 
                ? selectedCoin.price.toFixed(6) 
                : selectedCoin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-medium ${
              selectedCoin.change24h >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {selectedCoin.change24h >= 0 ? '+' : ''}
              {selectedCoin.change24h.toFixed(2)}% (24h)
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Chart Type Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Chart Type:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📈 Line
            </button>
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Candlestick
            </button>
          </div>
        </div>

        {/* Interval Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Interval:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {intervals.map((int) => (
              <button
                key={int.value}
                onClick={() => setInterval(int.value)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  interval === int.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-blue-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        )}
        {chartType === 'line' ? (
          <Line ref={chartRef} data={chartData} options={options} />
        ) : (
          <Bar ref={chartRef} data={chartData} options={{
            ...options,
            scales: {
              ...options.scales,
              y: {
                ...options.scales.y,
                min: (() => {
                  const candlestickData = historicalData?.candlestickData || generateMockData(selectedCoin, interval).candlestickData;
                  if (candlestickData.length === 0) return undefined;
                  const minLow = Math.min(...candlestickData.map(item => item.low));
                  return minLow * 0.995; // Add 0.5% padding below
                })(),
                max: (() => {
                  const candlestickData = historicalData?.candlestickData || generateMockData(selectedCoin, interval).candlestickData;
                  if (candlestickData.length === 0) return undefined;
                  const maxHigh = Math.max(...candlestickData.map(item => item.high));
                  return maxHigh * 1.005; // Add 0.5% padding above
                })(),
              }
            },
            plugins: {
              ...options.plugins,
              tooltip: {
                ...options.plugins.tooltip,
                filter: function(item) {
                  // Only show tooltip for the Open-Close bar (the third dataset)
                  return item.datasetIndex === 2;
                },
                callbacks: {
                  title: function(context) {
                    return context[0].label;
                  },
                  label: function(context) {
                    const dataIndex = context.dataIndex;
                    const candleData = historicalData?.candlestickData?.[dataIndex] || 
                      generateMockData(selectedCoin, interval).candlestickData[dataIndex];
                    if (candleData) {
                      return [
                        `Open: $${candleData.open.toFixed(2)}`,
                        `High: $${candleData.high.toFixed(2)}`,
                        `Low: $${candleData.low.toFixed(2)}`,
                        `Close: $${candleData.close.toFixed(2)}`
                      ];
                    }
                    return `Price: $${context.parsed.y.toFixed(2)}`;
                  }
                }
              }
            }
          }} />
        )}
      </div>

      {/* Chart Note */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        * {historicalData ? 'Real' : 'Simulated'} price data • Interval: {intervals.find(i => i.value === interval)?.label}
        {!historicalData && ' (Connect to CoinGecko API for real data)'}
      </div>
    </div>
  );
};

export default PriceChart;