# AZT Stock Exchange Simulator

A semi-serious stock exchange simulator for Minecraft mod authors built with React, Node.js, and Express.

## Features

- **User Authentication**: Secure login and registration system with JWT tokens
- **Real-time Stock Trading**: Track and trade stocks of top 50 Minecraft mod authors
- **Interactive Charts**: View price history with Recharts-powered visualizations
- **Portfolio Management**: Track your holdings, cash, and net worth
- **Leaderboard**: Compete with other traders globally
- **Live Market Updates**: Prices update automatically with market simulation
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Recharts for data visualization
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- JSON file storage (data/ directory)
- Node-cron for market simulation
- CORS and security middleware
- RESTful API design

### Data Storage
- JSON files in `data/` directory
- `authors.json` - Top 50 mod authors/stocks
- `history.json` - Price history for all stocks
- `users.json` - User accounts and portfolios

## Installation

### Prerequisites
- Node.js 16+ and npm
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AzerbaijanStocks
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Development Mode (Frontend + Backend separately)**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. **Production Mode (Combined server)**
   ```bash
   npm start
   ```
   - Application: http://localhost:3001
   - API: http://localhost:3001/api

5. **Windows Easy Start**
   ```batch
   start.bat
   ```

## Development vs Production

### Development Mode
- Frontend and backend run as separate servers
- Hot reload for both frontend and backend
- Frontend: http://localhost:3000 (React dev server)
- Backend API: http://localhost:3001

### Production Mode  
- Single Node.js server serves both frontend and API
- Built React app served as static files
- Everything runs on http://localhost:3001
- More efficient and Docker-friendly

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user account
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Logout user

### Stocks
- `GET /api/stocks` - List all stocks with current prices
- `GET /api/stocks/:ticker/history` - Get price history for a stock

### Portfolio (Protected)
- `GET /api/users/:id/portfolio` - Get user's portfolio
- `POST /api/users/:id/portfolio` - Buy/sell stocks

### Trading (Protected)
- `POST /api/buy` - Buy stocks
- `POST /api/sell` - Sell stocks

### Leaderboard
- `GET /api/leaderboard` - Get users ranked by net worth

### System
- `GET /api/health` - Health check endpoint

## Configuration

### Backend Environment Variables
```env
PORT=3001
TESTING_MODE=TRUE
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
API_BASE_URL=https://createranked.oreostack.uk/api
DEFAULT_CASH=1000
MARKET_UPDATE_INTERVAL=*/5 * * * *
```

### Market Simulation
- Runs every 5 minutes by default
- Applies small random price drifts
- Maintains 1000 historical data points per stock
- Supports fallback to random data in testing mode

## Docker Deployment

### Build and Run
```bash
docker build -t azt-stock-exchange .
docker run -p 3001:3001 -v $(pwd)/data:/app/data azt-stock-exchange
```

### Docker Compose
```bash
docker-compose up -d
```

### Access the Application
- Application: http://localhost:3001
- API: http://localhost:3001/api

The `data/` directory is mounted as a volume so you can inspect and backup the JSON files.

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start  # React dev server with hot reload
```

### Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## Data Backup System

The application includes an automated backup system to prevent data loss and ensure stability.

### Features
- **Automatic Backups**: Creates backups every 12 hours automatically
- **Manual Backups**: Can be triggered manually via API or command line
- **Atomic Writes**: Prevents data corruption during file operations
- **Auto-recovery**: Automatically recovers from corrupted files using backups
- **Cleanup**: Automatically deletes backups older than 7 days
- **Backup Verification**: Validates backup integrity

### Backup Commands

```bash
# Create a new backup
npm run backup

# List all available backups
npm run backup:list

# Clean up old backups (>7 days)
npm run backup:cleanup
```

### Backup API Endpoints

```bash
# Manually trigger backup
POST /api/admin/backup

# List available backups
GET /api/admin/backups
```

### Backup Storage
- Backups are stored in `data/backups/` directory
- Files are named with timestamp: `authors-2025-08-30T12-00-00-000Z.json`
- Each backup contains: `authors.json`, `history.json`, `users.json`
- Old backups (>7 days) are automatically cleaned up

### Data Recovery
If a data file becomes corrupted, the system will:
1. Detect the corruption during file read
2. Search for the most recent backup
3. Restore the data from backup
4. Log the recovery action

### Manual Recovery
If needed, you can manually restore from backup:

```bash
# List backups
npm run backup:list

# Copy the desired backup file to replace corrupted data
cp data/backups/authors-2025-08-30T12-00-00-000Z.json data/authors.json
```

## Features in Detail

### Market Simulation
- **Real API Integration**: Attempts to fetch real download data from external API
- **Fallback System**: Uses random data generation when API is unavailable
- **Testing Mode**: Controlled random data for development and testing
- **Price Conversion**: Converts download counts to stock prices

### Trading System
- **Buy/Sell Orders**: Market orders at current price
- **Portfolio Validation**: Checks for sufficient funds/shares
- **Real-time Updates**: Portfolio values update with market changes
- **Transaction History**: All trades are recorded

### Authentication
- **JWT Token System**: Secure authentication with JSON Web Tokens
- **User Registration**: Create new accounts with email verification
- **Password Security**: Bcrypt hashing for secure password storage
- **Session Management**: Automatic token refresh and logout
- **Protected Routes**: Frontend route protection for authenticated users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:
- Open a GitHub issue
- Check the documentation
- Review the API endpoints

---

**Note**: This is a simulation for entertainment and educational purposes. Not real financial advice!
