# 📊 CryptoPulse - Real-Time Crypto Analytics

A full-stack cryptocurrency analytics website that fetches real-time data from CoinGecko API, stores it in MongoDB, and displays live price charts and market statistics.

## 🚀 Features

- **Real-time Data**: Live cryptocurrency prices and market data
- **Advanced Charts**: Line and candlestick charts with multiple timeframes (1m, 15m, 1h, 4h, 1d)
- **Responsive Design**: Mobile-friendly interface with TailwindCSS
- **Market Overview**: Top gainers, losers, and market statistics
- **Auto-refresh**: Data updates every 30 seconds
- **Interactive Analysis**: Binance-style chart controls and OHLC data
- **Coin Details**: Detailed information for each cryptocurrency

## �️ Tech Stack

- **Backend**: Node.js, Express.js, Mongoose, Axios
- **Frontend**: React (Vite), Chart.js, TailwindCSS
- **Database**: MongoDB (Atlas)
- **API**: CoinGecko API

## � Project Structure

```
CryptoPulse/
├── server/                 # Express.js backend
│   ├── models/
│   │   └── Coin.js        # Mongoose coin model
│   ├── routes/
│   │   └── coins.js       # API routes
│   ├── index.js           # Server entry point
│   ├── package.json
│   └── .env.example
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CoinTable.jsx
│   │   │   └── PriceChart.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── package.json            # Root package.json with scripts
├── .gitignore
└── README.md
```

## � Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository** (if from git):
   ```bash
   git clone <your-repo-url>
   cd CryptoPulse
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   npm run install-server

   # Install client dependencies
   npm run install-client
   ```

3. **Set up environment variables**:
   ```bash
   # Copy the example env file
   cp server/.env.example server/.env
   
   # Edit server/.env with your MongoDB connection string
   ```

   Update `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/cryptopulse?retryWrites=true&w=majority
   PORT=5000
   COINGECKO_API_KEY=your_api_key_here  # Optional
   ```

4. **Run the application**:
   ```bash
   # Start both frontend and backend
   npm run dev
   ```

   Or run them separately:
   ```bash
   # Terminal 1: Start backend server
   npm run server

   # Terminal 2: Start frontend
   npm run client
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5002
   - Health check: http://localhost:5002/api/health

## 📡 API Endpoints

- `GET /api/coins` - Get top cryptocurrencies
- `GET /api/coins/:identifier` - Get specific coin by symbol or ID
- `GET /api/coins/trending/gainers` - Get top gaining coins
- `GET /api/health` - Health check endpoint

## 🔧 Available Scripts

### Root Scripts
- `npm run dev` - Start both client and server
- `npm run client` - Start frontend only
- `npm run server` - Start backend only
- `npm run install-all` - Install all dependencies
- `npm run build` - Build frontend for production

### Server Scripts (in /server)
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Client Scripts (in /client)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 Database Setup

### MongoDB Atlas (Recommended)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace `<username>` and `<password>` in the connection string
6. Update `MONGODB_URI` in `server/.env`

### Local MongoDB

If using local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/cryptopulse
```

## 🎨 Components

### CoinTable
- Displays cryptocurrency data in a table
- Clickable rows to select coins
- Real-time price updates
- Responsive design

### PriceChart
- Interactive price charts using Chart.js
- Multiple chart types: Line charts and Candlestick charts
- Multiple time intervals: 1m, 15m, 1h, 4h, 1d (like Binance)
- Real-time data integration with CoinGecko API
- Responsive and customizable
- Hover tooltips with OHLC data for candlestick charts

## 🔄 Data Flow

1. Backend fetches data from CoinGecko API
2. Data is stored/updated in MongoDB
3. Frontend requests data from backend API
4. Real-time updates every 30 seconds
5. Interactive charts and tables display the data

## 📱 Mobile Responsive

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the client: `npm run build --prefix client`
2. Deploy the `client/dist` folder

### Backend (Render/Railway)
1. Set environment variables
2. Deploy the `server` folder
3. Update frontend API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [CoinGecko API](https://www.coingecko.com/en/api) for cryptocurrency data
- [Chart.js](https://www.chartjs.org/) for charts
- [TailwindCSS](https://tailwindcss.com/) for styling