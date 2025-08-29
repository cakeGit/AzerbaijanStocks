const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const TESTING_MODE = process.env.TESTING_MODE === 'TRUE';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ALTERNATE_SIGNINS = process.env.ALTERNATE_SIGNINS === 'TRUE';
const DATA_DIR = path.join(__dirname, '..', 'data');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for React app
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));
}

// Data file paths
const AUTHORS_FILE = path.join(DATA_DIR, 'authors.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Global cache for external authors data
let externalAuthorsCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for aggregated history data
const historyCache = new Map();
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Fetch external authors data from createranked API
async function fetchExternalAuthorsData() {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (externalAuthorsCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      return externalAuthorsCache;
    }
    
    console.log('Fetching external authors data from createranked API...');
    const response = await axios.get('https://createranked.oreostack.uk/api/authors.json');
    
    if (response.data && response.data.authors) {
      externalAuthorsCache = response.data.authors;
      lastFetchTime = now;
      return externalAuthorsCache;
    } else {
      throw new Error('Invalid response format from external API');
    }
  } catch (error) {
    console.error('Error fetching external authors data:', error.message);
    return null;
  }
}

// Utility functions
async function readJsonFile(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error.message);
    return defaultValue;
  }
}

async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Failed to write ${filePath}:`, error.message);
    throw error;
  }
}

// Recalculate net worth for all users based on current stock prices
async function recalculateAllUsersNetWorth() {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});
    const authors = await readJsonFile(AUTHORS_FILE, []);

    let updatedCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let holdingsValue = 0;

      // Calculate value of holdings
      const holdings = user.holdings || [];
      for (const holding of holdings) {
        const stockHistory = history[holding.ticker] || [];

        // Get latest price for this stock
        let currentPrice = 100; // Default price
        if (stockHistory.length > 0) {
          // Find the last valid price
          for (let j = stockHistory.length - 1; j >= 0; j--) {
            const entry = stockHistory[j];
            if (entry.price && !isNaN(entry.price) && isFinite(entry.price)) {
              currentPrice = entry.price;
              break;
            }
          }
        }

        holdingsValue += holding.shares * currentPrice;
      }

      // Also check legacy shares format
      const shares = user.shares || {};
      for (const [ticker, shareCount] of Object.entries(shares)) {
        // Skip if already counted in holdings
        const alreadyCounted = holdings.some(h => h.ticker === ticker);
        if (alreadyCounted) continue;

        const stockHistory = history[ticker] || [];
        let currentPrice = 100; // Default price
        if (stockHistory.length > 0) {
          for (let j = stockHistory.length - 1; j >= 0; j--) {
            const entry = stockHistory[j];
            if (entry.price && !isNaN(entry.price) && isFinite(entry.price)) {
              currentPrice = entry.price;
              break;
            }
          }
        }

        holdingsValue += shareCount * currentPrice;
      }

      // Update net worth
      const newNetWorth = parseFloat((user.cash + holdingsValue).toFixed(2));
      if (user.netWorth !== newNetWorth) {
        user.netWorth = newNetWorth;
        updatedCount++;
      }
    }

    // Save updated users if any changes were made
    if (updatedCount > 0) {
      await writeJsonFile(USERS_FILE, users);
      console.log(`Updated net worth for ${updatedCount} users`);
    }

    return updatedCount;
  } catch (error) {
    console.error('Error recalculating net worth:', error);
    return 0;
  }
}

// Server-side data aggregation function
function aggregateHistoryData(data, granularity) {
  if (!data.length || granularity === 'minute') return data;

  const aggregated = [];
  let currentGroup = null;
  let groupData = [];

  for (const item of data) {
    const date = new Date(item.timestamp);
    let groupKey;

    switch (granularity) {
      case 'hour':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
        break;
      case 'day':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'month':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        return data;
    }

    if (currentGroup !== groupKey) {
      if (currentGroup && groupData.length > 0) {
        // Create aggregated entry
        const prices = groupData.map(d => d.price);
        const volumes = groupData.map(d => d.volume || 0);
        const firstItem = groupData[0];
        const lastItem = groupData[groupData.length - 1];

        aggregated.push({
          timestamp: firstItem.timestamp,
          price: lastItem.price,
          volume: volumes.reduce((sum, vol) => sum + vol, 0),
          change: lastItem.price - firstItem.price,
          high: Math.max(...prices),
          low: Math.min(...prices),
          open: firstItem.price,
          close: lastItem.price,
          count: groupData.length // Number of data points aggregated
        });
      }
      currentGroup = groupKey;
      groupData = [];
    }
    groupData.push(item);
  }

  // Handle last group
  if (groupData.length > 0) {
    const prices = groupData.map(d => d.price);
    const volumes = groupData.map(d => d.volume || 0);
    const firstItem = groupData[0];
    const lastItem = groupData[groupData.length - 1];

    aggregated.push({
      timestamp: firstItem.timestamp,
      price: lastItem.price,
      volume: volumes.reduce((sum, vol) => sum + vol, 0),
      change: lastItem.price - firstItem.price,
      high: Math.max(...prices),
      low: Math.min(...prices),
      open: firstItem.price,
      close: lastItem.price,
      count: groupData.length
    });
  }

  return aggregated;
}

// Portfolio data aggregation function
function aggregatePortfolioData(data, granularity) {
  if (!data.length || granularity === 'minute') return data;

  const aggregated = [];
  let currentGroup = null;
  let groupData = [];

  for (const item of data) {
    const date = new Date(item.timestamp);
    let groupKey;

    switch (granularity) {
      case 'hour':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
        break;
      case 'day':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'month':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        return data;
    }

    if (currentGroup !== groupKey) {
      if (currentGroup && groupData.length > 0) {
        // Create aggregated entry for portfolio data
        const values = groupData.map(d => d.value);
        const cashValues = groupData.map(d => d.cash);
        const holdingsValues = groupData.map(d => d.holdingsValue);
        const firstItem = groupData[0];
        const lastItem = groupData[groupData.length - 1];

        aggregated.push({
          timestamp: firstItem.timestamp,
          value: lastItem.value, // Use last value in the period
          cash: lastItem.cash, // Cash doesn't change over time in this model
          holdingsValue: lastItem.holdingsValue,
          high: Math.max(...values),
          low: Math.min(...values),
          open: firstItem.value,
          close: lastItem.value,
          count: groupData.length
        });
      }
      currentGroup = groupKey;
      groupData = [];
    }
    groupData.push(item);
  }

  // Handle last group
  if (groupData.length > 0) {
    const values = groupData.map(d => d.value);
    const cashValues = groupData.map(d => d.cash);
    const holdingsValues = groupData.map(d => d.holdingsValue);
    const firstItem = groupData[0];
    const lastItem = groupData[groupData.length - 1];

    aggregated.push({
      timestamp: firstItem.timestamp,
      value: lastItem.value,
      cash: lastItem.cash,
      holdingsValue: lastItem.holdingsValue,
      high: Math.max(...values),
      low: Math.min(...values),
      open: firstItem.value,
      close: lastItem.value,
      count: groupData.length
    });
  }

  return aggregated;
}



// Passport.js Configuration
app.use(passport.initialize());

// Passport strategies
if (ALTERNATE_SIGNINS) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const users = await readJsonFile(USERS_FILE, []);
      let user = users.find(u => u.providerId === profile.id && u.provider === 'google');

      if (!user) {
        // Create new user
        user = {
          id: profile.id,
          username: profile.displayName || profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          cash: 1000,
          shares: {},
          holdings: [],
          netWorth: 1000,
          createdAt: new Date().toISOString(),
          provider: 'google',
          providerId: profile.id,
        };
        users.push(user);
        await writeJsonFile(USERS_FILE, users);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/discord/callback`,
    scope: ['identify', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const users = await readJsonFile(USERS_FILE, []);
      let user = users.find(u => u.providerId === profile.id && u.provider === 'discord');

      if (!user) {
        // Create new user
        user = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          cash: 1000,
          shares: {},
          holdings: [],
          netWorth: 1000,
          createdAt: new Date().toISOString(),
          provider: 'discord',
          providerId: profile.id,
        };
        users.push(user);
        await writeJsonFile(USERS_FILE, users);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/github/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const users = await readJsonFile(USERS_FILE, []);
      let user = users.find(u => u.providerId === profile.id && u.provider === 'github');

      if (!user) {
        // Create new user
        user = {
          id: profile.id,
          username: profile.username || profile.displayName,
          email: profile.emails ? profile.emails[0].value : `${profile.username}@github.com`,
          cash: 1000,
          shares: {},
          holdings: [],
          netWorth: 1000,
          createdAt: new Date().toISOString(),
          provider: 'github',
          providerId: profile.id,
        };
        users.push(user);
        await writeJsonFile(USERS_FILE, users);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Serialize/deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.id === id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate random price data for testing
function generateRandomPrice(basePrice = 100) {
  const variation = basePrice * 2.0; // 200% variation
  return Math.max(1, basePrice + (Math.random() - 0.5) * variation);
}

function generateRandomDownloads() {
  return Math.floor(Math.random() * 4000) + 1000; // 1000-5000
}

function convertDownloadsToPrice(downloads) {
  // Simple conversion: downloads / 10 as base price
  return Math.max(1, downloads / 10);
}

// Fetch external API data (placeholder for real API)
async function fetchExternalData(authorUrl, curseforgeId) {
  try {
    // Fetch all external authors data
    const allAuthors = await fetchExternalAuthorsData();
    
    if (!allAuthors) {
      throw new Error('Failed to fetch external authors data');
    }
    
    // Find the specific author by name (assuming name matches curseforgeId)
    const authorData = allAuthors.find(author => author.name.toLowerCase() === curseforgeId.toLowerCase());
    
    if (!authorData) {
      console.warn(`Author ${curseforgeId} not found in external API data`);
      return null;
    }
    
    // Return data in the expected format
    return {
      [curseforgeId]: {
        downloads: authorData.downloadCount,
        mods: authorData.mods,
        downloadRate: authorData.downloadRate,
        daysExisting: authorData.daysExisting
      }
    };
  } catch (error) {
    console.warn(`WARN: API fetch failed for ${curseforgeId}, using fallback data`);
    return null;
  }
}

// Generate stock price with fallbacks
async function generateStockPrice(ticker, currentPrice = 100, authorUrl = null, curseforgeId = null) {
  const externalData = await fetchExternalData(authorUrl, curseforgeId);
  
  let price, change, volume;
  
  if (externalData && externalData[curseforgeId]) {
    // Use real API data
    const authorStats = externalData[curseforgeId];
    const downloads = authorStats.downloads;
    price = convertDownloadsToPrice(downloads);
    change = price - currentPrice;
    volume = Math.floor(downloads / 100);
  } else if (TESTING_MODE) {
    // Generate random data for testing
    const downloads = generateRandomDownloads();
    price = convertDownloadsToPrice(downloads);
    change = price - currentPrice;
    volume = Math.floor(downloads / 100);
  } else {
    // Default fallback
    price = currentPrice || 100;
    change = 0;
    volume = 0;
  }
  
  return { price: parseFloat(price.toFixed(2)), change: parseFloat(change.toFixed(2)), volume };
}

// API Routes

// GET /api/stocks - List all stocks with current prices
app.get('/api/stocks', async (req, res) => {
  try {
    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});
    const users = await readJsonFile(USERS_FILE, []);
    
    // Aggregate holdings by ticker across all users
    const holdingsByTicker = new Map();
    
    for (const user of users) {
      // Check holdings array
      if (user.holdings && Array.isArray(user.holdings)) {
        for (const holding of user.holdings) {
          const ticker = holding.ticker;
          const shares = holding.shares || 0;
          holdingsByTicker.set(ticker, (holdingsByTicker.get(ticker) || 0) + shares);
        }
      }
      
      // Check legacy shares format
      if (user.shares && typeof user.shares === 'object') {
        for (const [ticker, shares] of Object.entries(user.shares)) {
          const shareCount = parseInt(shares) || 0;
          holdingsByTicker.set(ticker, (holdingsByTicker.get(ticker) || 0) + shareCount);
        }
      }
    }
    
    const stocks = authors.map((author) => {
      const { ticker, name, authorUrl, curseforgeId } = author;
      const stockHistory = history[ticker] || [];
      
      // Get latest price and data from history, or use defaults
      let price = 100;
      let change = 0;
      let volume = 1000;
      let dataSource = 'generated'; // Default to generated
      
      if (stockHistory.length > 0) {
        const latest = stockHistory[stockHistory.length - 1];
        price = latest.price || 100;
        volume = latest.volume || 1000;
        
        // Calculate change from previous entry
        if (stockHistory.length > 1) {
          const previous = stockHistory[stockHistory.length - 2];
          change = latest.change || ((price - previous.price) / previous.price) * 100;
        } else {
          change = latest.change || 0;
        }
        
        // Check if any history entry has real data source
        const hasRealData = stockHistory.some(entry => entry.dataSource === 'statistics');
        if (hasRealData) {
          dataSource = 'statistics';
        }
      }
      
      // Get total shares owned by all users
      const totalSharesOwned = holdingsByTicker.get(ticker) || 0;
      
      return {
        ticker,
        name,
        authorUrl,
        curseforgeId,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        volume: volume,
        dataSource,
        totalSharesOwned
      };
    });
    
    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// GET /api/stocks/:ticker/history - Get price history for a specific stock
app.get('/api/stocks/:ticker/history', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { period = '1D', granularity = 'minute' } = req.query;
    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});

    // Check if ticker exists
    const authorExists = authors.some(author => author.ticker === ticker);
    if (!authorExists) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Create cache key
    const cacheKey = `${ticker}-${period}-${granularity}`;

    // Check cache first
    const cachedResult = historyCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRY) {
      return res.json(cachedResult.data);
    }

    let stockHistory = history[ticker];
    let dataSource = 'generated'; // Default

    // Generate history if missing - try real API data first
    if (!stockHistory || stockHistory.length === 0) {
      // Get author data for this ticker
      const author = authors.find(a => a.ticker === ticker);
      if (author) {
        try {
          const externalData = await fetchExternalData(author.authorUrl, author.curseforgeId);

          if (externalData && externalData[author.curseforgeId]) {
            const authorStats = externalData[author.curseforgeId];
            const basePrice = convertDownloadsToPrice(authorStats.downloads);

            // Generate 30 days of history based on real data
            stockHistory = [];
            const now = new Date();

            for (let i = 29; i >= 0; i--) {
              const date = new Date(now);
              date.setDate(date.getDate() - i);

              // Add some realistic volatility around the base price
              const volatility = 0.05; // 5% daily volatility
              const randomFactor = (Math.random() - 0.5) * volatility;
              const price = Math.max(1, basePrice * (1 + randomFactor));

              stockHistory.push({
                timestamp: date.toISOString(),
                price: parseFloat(price.toFixed(2)),
                volume: Math.floor(authorStats.downloads / 100) + Math.floor(Math.random() * 1000),
                dataSource: 'statistics' // Mark as real data
              });
            }

            dataSource = 'statistics'; // Mark that this came from real API
            // Save generated history based on real data
            history[ticker] = stockHistory;
            await writeJsonFile(HISTORY_FILE, history);
          } else {
          }
        } catch (error) {
          console.warn(`Failed to fetch external data for ${ticker}:`, error.message);
        }
      }

      // If we still don't have history (API failed), generate random walk
      if (!stockHistory || stockHistory.length === 0) {
        stockHistory = [];
        const basePrice = 100;
        const now = new Date();

        // Generate 30 days of history
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);

          const price = i === 29 ? basePrice :
            Math.max(1, stockHistory[stockHistory.length - 1].price * (0.95 + Math.random() * 4.0));

          stockHistory.push({
            timestamp: date.toISOString(),
            price: parseFloat(price.toFixed(2)),
            dataSource: 'generated' // Mark as generated
          });
        }

        // Save generated history
        history[ticker] = stockHistory;
        await writeJsonFile(HISTORY_FILE, history);
      }
    } else {
      // Check existing history for data source
      const hasRealData = stockHistory.some(entry => entry.dataSource === 'statistics');
      if (hasRealData) {
        dataSource = 'statistics';
      }
    }

    // Apply time period filtering
    const periodConfig = {
      '1H': { hours: 1 },
      '1D': { days: 1 },
      '1W': { days: 7 },
      '1M': { days: 30 },
      '3M': { days: 90 },
      '6M': { days: 180 },
      '1Y': { days: 365 }
    };

    const config = periodConfig[period];
    if (!config) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    const cutoffDate = new Date();
    if (config.hours) {
      cutoffDate.setHours(cutoffDate.getHours() - config.hours);
    } else if (config.days) {
      cutoffDate.setDate(cutoffDate.getDate() - config.days);
    }

    let filteredHistory = stockHistory.filter(item => new Date(item.timestamp) >= cutoffDate);

    // Apply server-side aggregation based on granularity
    if (granularity !== 'minute') {
      filteredHistory = aggregateHistoryData(filteredHistory, granularity);
    }

    const result = {
      ticker,
      period,
      granularity,
      data: filteredHistory,
      totalPoints: filteredHistory.length,
      cached: false,
      dataSource
    };

    // Cache the result
    historyCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (historyCache.size > 100) {
      const cutoffTime = Date.now() - CACHE_EXPIRY;
      for (const [key, value] of historyCache.entries()) {
        if (value.timestamp < cutoffTime) {
          historyCache.delete(key);
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ error: 'Failed to fetch stock history' });
  }
});// GET /api/external-authors - Get all external authors data
app.get('/api/external-authors', async (req, res) => {
  try {
    const externalAuthors = await fetchExternalAuthorsData();
    
    if (!externalAuthors) {
      return res.status(503).json({ error: 'External API unavailable' });
    }
    
    // Filter to only include authors that exist in our local index
    const localAuthors = await readJsonFile(AUTHORS_FILE, []);
    const localCurseforgeIds = new Set(localAuthors.map(author => author.curseforgeId.toLowerCase()));
    
    const filteredAuthors = externalAuthors.filter(author => localCurseforgeIds.has(author.name.toLowerCase()));
    
    res.json({
      generatedAt: new Date().toISOString(),
      authors: filteredAuthors,
      totalAuthors: filteredAuthors.length
    });
  } catch (error) {
    console.error('Error fetching external authors:', error);
    res.status(500).json({ error: 'Failed to fetch external authors data' });
  }
});

// GET /api/authors/:ticker - Get detailed author information
app.get('/api/authors/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const authors = await readJsonFile(AUTHORS_FILE, []);
    
    const author = authors.find(a => a.ticker === ticker);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    // Try to get external data
    let externalData = null;
    try {
      const externalAuthors = await fetchExternalAuthorsData();
      if (externalAuthors) {
        externalData = externalAuthors.find(extAuthor => extAuthor.name.toLowerCase() === author.curseforgeId.toLowerCase());
      }
    } catch (error) {
      console.warn(`Failed to fetch external data for ${ticker}:`, error.message);
    }
    
    const response = {
      ticker: author.ticker,
      name: author.name,
      authorUrl: author.authorUrl,
      curseforgeId: author.curseforgeId,
      profileLink: author.authorUrl,
      lastUpdated: new Date().toISOString()
    };
    
    // Add external data if available
    if (externalData) {
      response.externalData = {
        downloadCount: externalData.downloadCount,
        mods: externalData.mods,
        downloadRate: externalData.downloadRate,
        daysExisting: externalData.daysExisting
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching author info:', error);
    res.status(500).json({ error: 'Failed to fetch author information' });
  }
});

// GET /api/user/:userId - Get specific user data for balance widget
app.get('/api/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.id || req.auth?.user?.id;

    // Check if user is requesting their own data
    if (userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await readJsonFile(USERS_FILE, []);
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Migrate old shares format to holdings if needed and consolidate
    if (user.shares && Object.keys(user.shares).length > 0) {
      // Initialize holdings if it doesn't exist
      if (!user.holdings) {
        user.holdings = [];
      }
      
      // Consolidate shares into holdings
      for (const [ticker, shareCount] of Object.entries(user.shares)) {
        const existingHolding = user.holdings.find(h => h.ticker === ticker);
        if (existingHolding) {
          // Add shares from old format to existing holding
          existingHolding.shares += parseInt(shareCount);
        } else {
          // Create new holding
          user.holdings.push({ ticker, shares: parseInt(shareCount) });
        }
      }
      
      // Clear old shares format after migration
      user.shares = {};
      
      // Save migrated data
      await writeJsonFile(USERS_FILE, users);
    }
    
    res.json({
      id: user.id,
      username: user.username,
      cash: user.cash,
      shares: user.shares || {}, // Keep for backward compatibility
      holdings: user.holdings || [], // New format
      netWorth: user.netWorth
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// POST /api/buy - Buy stocks
app.post('/api/buy', authenticateToken, async (req, res) => {
  try {
    const { ticker, quantity } = req.body;
    const userId = req.user?.id || req.auth?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!ticker || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const users = await readJsonFile(USERS_FILE, []);
    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});
    
    // Check if ticker exists
    const authorExists = authors.some(author => author.ticker === ticker);
    if (!authorExists) {
      return res.status(400).json({ error: 'Invalid ticker' });
    }
    
    // Get current stock price
    const stockHistory = history[ticker] || [];
    const currentPrice = stockHistory.length > 0 ? stockHistory[stockHistory.length - 1].price : 100;
    const totalCost = quantity * currentPrice;
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[userIndex];
    
    if (user.cash < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    // Process transaction
    user.cash = parseFloat((user.cash - totalCost).toFixed(2));
    
    if (!user.shares) {
      user.shares = {};
    }
    
    user.shares[ticker] = (user.shares[ticker] || 0) + quantity;
    
    // Recalculate net worth using current market prices
    let holdingsValue = 0;
    for (const [stockTicker, shareCount] of Object.entries(user.shares)) {
      const stockHistory = history[stockTicker] || [];
      let currentPrice = 100; // Default price
      
      if (stockHistory.length > 0) {
        for (let i = stockHistory.length - 1; i >= 0; i--) {
          const entry = stockHistory[i];
          if (entry.price && !isNaN(entry.price) && isFinite(entry.price)) {
            currentPrice = entry.price;
            break;
          }
        }
      }
      
      holdingsValue += shareCount * currentPrice;
    }
    
    user.netWorth = parseFloat((user.cash + holdingsValue).toFixed(2));
    
    // Update user data
    users[userIndex] = user;
    await writeJsonFile(USERS_FILE, users);
    
    res.json({
      success: true,
      transaction: {
        type: 'buy',
        ticker,
        quantity,
        price: currentPrice,
        total: totalCost
      },
      newBalance: user.cash,
      newShares: user.shares[ticker]
    });
  } catch (error) {
    console.error('Error processing buy order:', error);
    res.status(500).json({ error: 'Failed to process buy order' });
  }
});

// POST /api/sell - Sell stocks
app.post('/api/sell', authenticateToken, async (req, res) => {
  try {
    const { ticker, quantity } = req.body;
    const userId = req.user?.id || req.auth?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!ticker || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const users = await readJsonFile(USERS_FILE, []);
    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});
    
    // Check if ticker exists
    const authorExists = authors.some(author => author.ticker === ticker);
    if (!authorExists) {
      return res.status(400).json({ error: 'Invalid ticker' });
    }
    
    // Get current stock price
    const stockHistory = history[ticker] || [];
    const currentPrice = stockHistory.length > 0 ? stockHistory[stockHistory.length - 1].price : 100;
    const totalRevenue = quantity * currentPrice;
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[userIndex];
    
    if (!user.shares || !user.shares[ticker] || user.shares[ticker] < quantity) {
      return res.status(400).json({ error: 'Insufficient shares' });
    }
    
    // Process transaction
    user.cash = parseFloat((user.cash + totalRevenue).toFixed(2));
    user.shares[ticker] -= quantity;
    
    // Remove ticker if no shares left
    if (user.shares[ticker] === 0) {
      delete user.shares[ticker];
    }
    
    // Recalculate net worth using current market prices
    let holdingsValue = 0;
    for (const [stockTicker, shareCount] of Object.entries(user.shares)) {
      const stockHistory = history[stockTicker] || [];
      let currentPrice = 100; // Default price
      
      if (stockHistory.length > 0) {
        for (let i = stockHistory.length - 1; i >= 0; i--) {
          const entry = stockHistory[i];
          if (entry.price && !isNaN(entry.price) && isFinite(entry.price)) {
            currentPrice = entry.price;
            break;
          }
        }
      }
      
      holdingsValue += shareCount * currentPrice;
    }
    
    user.netWorth = parseFloat((user.cash + holdingsValue).toFixed(2));
    
    // Update user data
    users[userIndex] = user;
    await writeJsonFile(USERS_FILE, users);
    
    res.json({
      success: true,
      transaction: {
        type: 'sell',
        ticker,
        quantity,
        price: currentPrice,
        total: totalRevenue
      },
      newBalance: user.cash,
      newShares: user.shares[ticker] || 0
    });
  } catch (error) {
    console.error('Error processing sell order:', error);
    res.status(500).json({ error: 'Failed to process sell order' });
  }
});

// GET /api/users/:id/portfolio - Get user portfolio
app.get('/api/users/:id/portfolio', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.auth?.user?.id;

    // Check if user is requesting their own portfolio
    if (id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const users = await readJsonFile(USERS_FILE, []);
    
    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Migrate old shares format to holdings if needed
    if (user.shares && Object.keys(user.shares).length > 0 && (!user.holdings || user.holdings.length === 0)) {
      user.holdings = Object.entries(user.shares).map(([ticker, shares]) => ({
        ticker,
        shares: parseInt(shares)
      }));
      // Save migrated data
      await writeJsonFile(USERS_FILE, users);
    }
    
    res.json({
      id: user.id,
      username: user.username,
      cash: user.cash,
      holdings: user.holdings || [],
      netWorth: user.netWorth
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// POST /api/users/:id/portfolio - Update portfolio (buy/sell)
app.post('/api/users/:id/portfolio', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, ticker, shares, price } = req.body;
    const userId = req.user?.id || req.auth?.user?.id;
    
    // Check if user is updating their own portfolio
    if (id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!['buy', 'sell'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be buy or sell' });
    }
    
    const users = await readJsonFile(USERS_FILE, []);
    const authors = await readJsonFile(AUTHORS_FILE, []);
    
    // Check if ticker exists
    const tickerExists = authors.some(author => author.ticker === ticker);
    if (!tickerExists) {
      return res.status(400).json({ error: 'Invalid ticker' });
    }
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[userIndex];
    const totalCost = shares * price;
    
    // Initialize holdings and shares if they don't exist
    if (!user.holdings) user.holdings = [];
    if (!user.shares) user.shares = {};
    
    if (action === 'buy') {
      if (user.cash < totalCost) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      
      user.cash -= totalCost;
      const existingHolding = user.holdings.find(h => h.ticker === ticker);
      
      if (existingHolding) {
        existingHolding.shares += shares;
      } else {
        user.holdings.push({ ticker, shares });
      }
      
      // Update shares object for backward compatibility
      user.shares[ticker] = (user.shares[ticker] || 0) + shares;
    } else if (action === 'sell') {
      const holding = user.holdings.find(h => h.ticker === ticker);
      if (!holding || holding.shares < shares) {
        return res.status(400).json({ error: 'Insufficient shares' });
      }
      
      user.cash += totalCost;
      holding.shares -= shares;
      
      // Remove holding if shares reach 0
      if (holding.shares === 0) {
        user.holdings = user.holdings.filter(h => h.ticker !== ticker);
      }
      
      // Update shares object for backward compatibility
      user.shares[ticker] = (user.shares[ticker] || 0) - shares;
      if (user.shares[ticker] <= 0) {
        delete user.shares[ticker];
      }
    }
    
    // Recalculate net worth using current market prices
    const history = await readJsonFile(HISTORY_FILE, {});
    let holdingsValue = 0;
    
    for (const holding of user.holdings) {
      const stockHistory = history[holding.ticker] || [];
      let currentPrice = 100; // Default price
      
      if (stockHistory.length > 0) {
        // Find the last valid price
        for (let i = stockHistory.length - 1; i >= 0; i--) {
          const entry = stockHistory[i];
          if (entry.price && !isNaN(entry.price) && isFinite(entry.price)) {
            currentPrice = entry.price;
            break;
          }
        }
      }
      
      holdingsValue += holding.shares * currentPrice;
    }
    
    user.netWorth = parseFloat((user.cash + holdingsValue).toFixed(2));
    
    users[userIndex] = user;
    await writeJsonFile(USERS_FILE, users);
    
    res.json({
      id: user.id,
      username: user.username,
      cash: user.cash,
      holdings: user.holdings,
      netWorth: user.netWorth
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

// GET /api/users/:id/portfolio/history - Get user portfolio history
app.get('/api/users/:id/portfolio/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '1D', granularity = 'minute' } = req.query;
    const userId = req.user?.id || req.auth?.user?.id;

    // Check if user is requesting their own portfolio
    if (id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await readJsonFile(USERS_FILE, []);
    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});

    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's holdings (migrate old format if needed)
    let holdings = user.holdings || [];
    if (user.shares && Object.keys(user.shares).length > 0 && holdings.length === 0) {
      holdings = Object.entries(user.shares).map(([ticker, shares]) => ({
        ticker,
        shares: parseInt(shares)
      }));
    }

    // If no holdings, return empty history
    if (holdings.length === 0) {
      return res.json({
        userId: id,
        period,
        granularity,
        data: [],
        totalPoints: 0,
        dataSource: 'generated'
      });
    }

    // Apply time period filtering
    const periodConfig = {
      '1H': { hours: 1 },
      '1D': { days: 1 },
      '1W': { days: 7 },
      '1M': { days: 30 },
      '3M': { days: 90 },
      '6M': { days: 180 },
      '1Y': { days: 365 }
    };

    const config = periodConfig[period];
    if (!config) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    const cutoffDate = new Date();
    if (config.hours) {
      cutoffDate.setHours(cutoffDate.getHours() - config.hours);
    } else if (config.days) {
      cutoffDate.setDate(cutoffDate.getDate() - config.days);
    }

    // Collect all timestamps from stock histories
    const allTimestamps = new Set();
    const stockHistories = {};

    for (const holding of holdings) {
      const stockHistory = history[holding.ticker] || [];
      stockHistories[holding.ticker] = stockHistory;

      // Add timestamps that are within our period
      stockHistory.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= cutoffDate) {
          allTimestamps.add(entry.timestamp);
        }
      });
    }

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // Calculate portfolio value at each timestamp
    const portfolioHistory = [];
    const userCash = user.cash || 0;

    for (const timestamp of sortedTimestamps) {
      let holdingsValue = 0;

      for (const holding of holdings) {
        const stockHistory = stockHistories[holding.ticker] || [];

        // Find the closest price data for this timestamp
        let priceData = null;
        for (let i = stockHistory.length - 1; i >= 0; i--) {
          const entry = stockHistory[i];
          if (new Date(entry.timestamp) <= new Date(timestamp)) {
            priceData = entry;
            break;
          }
        }

        // If no historical data found, use current price or default
        if (!priceData) {
          const currentStock = authors.find(a => a.ticker === holding.ticker);
          const currentPrice = currentStock ? (history[holding.ticker]?.[history[holding.ticker].length - 1]?.price || 100) : 100;
          holdingsValue += holding.shares * currentPrice;
        } else {
          holdingsValue += holding.shares * priceData.price;
        }
      }

      const totalValue = userCash + holdingsValue;

      portfolioHistory.push({
        timestamp,
        value: parseFloat(totalValue.toFixed(2)),
        cash: parseFloat(userCash.toFixed(2)),
        holdingsValue: parseFloat(holdingsValue.toFixed(2))
      });
    }

    // Apply server-side aggregation based on granularity
    let aggregatedHistory = portfolioHistory;
    if (granularity !== 'minute') {
      aggregatedHistory = aggregatePortfolioData(portfolioHistory, granularity);
    }

    // Determine data source
    let dataSource = 'generated';
    const hasRealData = Object.values(stockHistories).some(stockHistory =>
      stockHistory.some(entry => entry.dataSource === 'statistics')
    );
    if (hasRealData) {
      dataSource = 'statistics';
    }

    res.json({
      userId: id,
      period,
      granularity,
      data: aggregatedHistory,
      totalPoints: aggregatedHistory.length,
      dataSource,
      holdings: holdings
    });
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio history' });
  }
});

// GET /api/leaderboard - Get users ranked by net worth
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    
    const leaderboard = users
      .map(user => ({
        id: user.id,
        username: user.username,
        netWorth: user.netWorth
      }))
      .sort((a, b) => b.netWorth - a.netWorth);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// OAuth Routes
if (ALTERNATE_SIGNINS) {
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { id: req.user.id, username: req.user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${token}`);
    }
  );

  app.get('/api/auth/discord', passport.authenticate('discord'));

  app.get('/api/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }),
    (req, res) => {
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { id: req.user.id, username: req.user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${token}`);
    }
  );

  app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

  app.get('/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { id: req.user.id, username: req.user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${token}`);
    }
  );
}

// Legacy authentication routes (for backward compatibility)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const users = await readJsonFile(USERS_FILE, []);
    
    // Check if user already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      username,
      email,
      password: hashedPassword,
      cash: 1000, // Starting cash
      shares: {},
      holdings: [],
      netWorth: 1000,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeJsonFile(USERS_FILE, users);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        cash: newUser.cash,
        netWorth: newUser.netWorth
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = await readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        cash: user.cash,
        netWorth: user.netWorth
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/logout - Logout user
app.post('/api/auth/logout', (req, res) => {
  // Since we're using JWT tokens stored on the client side,
  // logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      cash: user.cash,
      netWorth: user.netWorth,
      provider: user.provider
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// GET /api/auth/session - Get current session (for OAuth compatibility)
app.get('/api/auth/session', (req, res) => {
  res.json({ user: null }); // OAuth users get JWT tokens instead
});

// Market simulation - runs every 1 minute with enhanced trends
cron.schedule('* * * * *', async () => {
  // console.log('Running enhanced market simulation...');
  
  try {
    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    
    // Market hours simulation (9 AM - 4 PM EST, more volatile during market hours)
    const isMarketHours = currentHour >= 9 && currentHour <= 16;
    const baseVolatility = isMarketHours ? 0.02 : 0.005; // 2% max during market hours, 0.5% after hours
    
    for (const author of authors) {
      const { ticker, curseforgeId, authorUrl } = author;
      const stockHistory = history[ticker] || [];
      
      // Get current price from history, with fallback to default
      let currentPrice = 100; // Default price
      if (stockHistory.length > 0) {
        // Find the last valid price (not null/NaN)
        for (let i = stockHistory.length - 1; i >= 0; i--) {
          const entry = stockHistory[i];
          if (entry.price && !isNaN(entry.price) && isFinite(entry.price)) {
            currentPrice = entry.price;
            break;
          }
        }
      }
      
      // Ensure currentPrice is valid
      if (!currentPrice || isNaN(currentPrice) || !isFinite(currentPrice)) {
        console.warn(`Warning: Invalid currentPrice for ${ticker}, using default of 100`);
        currentPrice = 100;
      }
      
      // Try to get real data from external API
      let realPrice = null;
      let realVolume = null;
      
      try {
        const externalData = await fetchExternalData(authorUrl, curseforgeId);
        if (externalData && externalData[curseforgeId]) {
          const authorStats = externalData[curseforgeId];
          realPrice = convertDownloadsToPrice(authorStats.downloads);
          realVolume = Math.floor(authorStats.downloads / 100);
        }
      } catch (error) {
        console.warn(`Failed to fetch real data for ${ticker}:`, error.message);
      }
      
      let newPrice;
      let volume;
      
      if (realPrice !== null) {
        // Gradual price movement towards target price
        const targetPrice = realPrice;
        const priceDifference = targetPrice - currentPrice;
        const maxDailyMovement = currentPrice * 2.0; // Max 200% movement per day

        // Calculate how much to move this minute (assuming 1440 minutes in a trading day)
        const minuteMovement = maxDailyMovement / 1440;
        const maxMinuteChange = Math.min(Math.abs(priceDifference), minuteMovement);

        // Move price towards target, but add market volatility
        let priceAdjustment;
        if (Math.abs(priceDifference) < minuteMovement) {
          // Close to target, move directly with small volatility
          priceAdjustment = priceDifference + (Math.random() - 0.5) * (currentPrice * 0.005);
        } else {
          // Far from target, move gradually towards it with volatility
          const direction = priceDifference > 0 ? 1 : -1;
          priceAdjustment = direction * maxMinuteChange + (Math.random() - 0.5) * (currentPrice * 0.01);
        }

        newPrice = Math.max(0.01, currentPrice + priceAdjustment);
        volume = realVolume;

      } else {
        // Fallback to simulated data
        // Get download trend from CurseForge ID (simulate with base trend for now)
        const baseTrend = Math.sin(Date.now() / (1000 * 60 * 60 * 24)) * 0.1; // Daily cycle
        
        // Calculate trend-based value: 1000 downloads = 100 stock value
        const curseforgeIdNum = curseforgeId ? Math.abs(parseInt(curseforgeId) || 1) : 1;
        const simulatedDownloads = curseforgeIdNum * 1000 + Math.floor(Math.random() * 5000);
        const downloadTrend = simulatedDownloads / 1000 * 100;
        const trendInfluence = (downloadTrend / currentPrice) * 0.001; // Small influence based on download ratio
        
        // Random walk with trend bias
        const randomChange = (Math.random() - 0.5) * baseVolatility;
        const trendBias = baseTrend * 0.005 + trendInfluence;
        const totalChange = randomChange + trendBias;
        
        // Apply price change with bounds check
        newPrice = Math.max(0.01, currentPrice * (1 + totalChange));
        volume = Math.floor(Math.random() * (isMarketHours ? 10000 : 2000)) + 1000;
      }
      
      // Ensure newPrice is a valid number
      if (isNaN(newPrice) || !isFinite(newPrice)) {
        console.error(`Invalid price calculation for ${ticker}: currentPrice=${currentPrice}`);
        continue; // Skip this stock update
      }
      
      const changePercent = ((newPrice - currentPrice) / currentPrice) * 100;
      
      const newEntry = {
        timestamp: currentDate.toISOString(),
        price: parseFloat(newPrice.toFixed(2)),
        volume: volume,
        change: parseFloat(changePercent.toFixed(2)),
        dataSource: realPrice !== null ? 'statistics' : 'generated'
      };
      
      // Validate the entry before storing
      if (isNaN(newEntry.price) || isNaN(newEntry.change) || !isFinite(newEntry.price)) {
        console.error(`Skipping invalid entry for ${ticker}: price=${newEntry.price}, change=${newEntry.change}`);
        continue;
      }
      
      if (!history[ticker]) {
        history[ticker] = [];
      }
      
      history[ticker].push(newEntry);
      
      // Keep only last 1000 entries (about 16 hours of minute data)
      if (history[ticker].length > 1000) {
        history[ticker] = history[ticker].slice(-1000);
      }
      
      // console.log(`Updated ${ticker}: $${currentPrice.toFixed(2)} -> $${newPrice.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%) Vol: ${volume}`);
    }
    
    await writeJsonFile(HISTORY_FILE, history);
    
    // Recalculate net worth for all users based on updated prices
    await recalculateAllUsersNetWorth();
    
    // console.log('Enhanced market simulation completed');
  } catch (error) {
    console.error('Error in market simulation:', error);
  }
});

// GET /api/active-traders - Get count of active traders
app.get('/api/active-traders', async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);

    // Define active traders as users who have holdings or shares
    const activeTraders = users.filter(user => {
      // Check if user has holdings
      const hasHoldings = user.holdings && user.holdings.length > 0;

      // Check if user has shares (legacy format)
      const hasShares = user.shares && Object.keys(user.shares).length > 0;

      // Check if user has made recent transactions (if we had transaction history)
      // For now, we'll consider users with holdings/shares as active

      return hasHoldings || hasShares;
    });

    res.json({
      count: activeTraders.length,
      totalUsers: users.length,
      activeUsers: activeTraders.map(user => ({
        id: user.id,
        username: user.username,
        hasHoldings: user.holdings && user.holdings.length > 0,
        hasShares: user.shares && Object.keys(user.shares).length > 0
      }))
    });
  } catch (error) {
    console.error('Error fetching active traders count:', error);
    res.status(500).json({ error: 'Failed to fetch active traders count' });
  }
});
app.get('/api/downloads/status', async (req, res) => {
  try {
    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});

    // Check external API availability
    let externalApiStatus = 'unknown';
    let lastExternalFetch = null;
    let externalAuthorsCount = 0;

    try {
      const externalAuthors = await fetchExternalAuthorsData();
      if (externalAuthors) {
        externalApiStatus = 'available';
        externalAuthorsCount = externalAuthors.length;
        lastExternalFetch = lastFetchTime;
      } else {
        externalApiStatus = 'unavailable';
      }
    } catch (error) {
      externalApiStatus = 'error';
      console.warn('External API check failed:', error.message);
    }

    // Analyze data sources for all stocks
    let totalStocks = authors.length;
    let stocksWithRealData = 0;
    let stocksWithGeneratedData = 0;
    let stocksWithNoData = 0;

    const stockStatuses = [];

    for (const author of authors) {
      const { ticker, name, curseforgeId } = author;
      const stockHistory = history[ticker] || [];

      let dataSource = 'none';
      let lastUpdate = null;
      let dataPoints = 0;

      if (stockHistory.length > 0) {
        dataPoints = stockHistory.length;
        lastUpdate = stockHistory[stockHistory.length - 1].timestamp;

        // Check if any history entry has real data
        const hasRealData = stockHistory.some(entry => entry.dataSource === 'statistics');
        if (hasRealData) {
          dataSource = 'statistics';
          stocksWithRealData++;
        } else {
          dataSource = 'generated';
          stocksWithGeneratedData++;
        }
      } else {
        stocksWithNoData++;
      }

      stockStatuses.push({
        ticker,
        name,
        curseforgeId,
        dataSource,
        dataPoints,
        lastUpdate
      });
    }

    // Cache status
    const cacheStatus = {
      historyCacheSize: historyCache.size,
      externalAuthorsCache: externalAuthorsCache ? 'available' : 'empty',
      lastCacheUpdate: lastFetchTime
    };

    // System status summary
    const systemStatus = {
      isGeneratingData: stocksWithGeneratedData > 0 || stocksWithNoData > 0,
      isUsingRealStats: stocksWithRealData > 0,
      dataFreshness: lastExternalFetch ?
        (Date.now() - lastExternalFetch < CACHE_DURATION ? 'fresh' : 'stale') : 'unknown'
    };

    res.json({
      timestamp: new Date().toISOString(),
      systemStatus,
      externalApi: {
        status: externalApiStatus,
        authorsCount: externalAuthorsCount,
        lastFetch: lastExternalFetch
      },
      stocks: {
        total: totalStocks,
        withRealData: stocksWithRealData,
        withGeneratedData: stocksWithGeneratedData,
        withNoData: stocksWithNoData
      },
      cache: cacheStatus,
      stockStatuses
    });

  } catch (error) {
    console.error('Error fetching downloads status:', error);
    res.status(500).json({ error: 'Failed to fetch downloads status' });
  }
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    alternateSignins: ALTERNATE_SIGNINS,
    testingMode: TESTING_MODE
  });
});

// Serve React app for all non-API routes (must be last)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`AZT Stock Exchange running on port ${PORT}`);
  console.log(`Testing mode: ${TESTING_MODE}`);
  console.log(`Alternate sign-ins: ${ALTERNATE_SIGNINS}`);
  
  if (ALTERNATE_SIGNINS) {
    console.log('OAuth providers configured: Google, Discord, GitHub');
  } else {
    console.log('OAuth providers disabled');
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('Serving React app from backend server');
    console.log(`Frontend available at: http://localhost:${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/api`);
  }
});
