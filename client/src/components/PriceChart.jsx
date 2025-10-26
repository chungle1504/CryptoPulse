import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ selectedCoin, coins }) => {
  const chartRef = useRef();

  // Generate mock historical data for demonstration
  const generateMockData = (coin) => {
    if (!coin) return { labels: [], data: [] };

    const labels = [];
    const data = [];
    const now = new Date();
    const currentPrice = coin.price;
    const change24h = coin.change24h;

    // Generate 24 hours of hourly data
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      // Simulate price movement based on 24h change
      const progress = (23 - i) / 23;
      const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% random variation
      const priceAtTime = currentPrice * (1 - (change24h / 100) * (1 - progress) + randomVariation);
      
      data.push(Math.max(0, priceAtTime));
    }

    return { labels, data };
  };

  const { labels, data } = generateMockData(selectedCoin);

  const chartData = {
    labels,
    datasets: [
      {
        label: selectedCoin ? `${selectedCoin.name} Price (USD)` : 'Price',
        data,
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

  if (data.length === 0) {
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

      {/* Chart */}
      <div className="h-64">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Chart Note */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        * Simulated 24-hour price data for demonstration purposes
      </div>
    </div>
  );
};

export default PriceChart;