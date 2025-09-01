import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { convertDownloadsToPrice } from './utils/priceCalculator.cjs';

// Get current file directory using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATA_DIR = path.join(__dirname, 'data');
const AUTHORS_FILE = path.join(DATA_DIR, 'authors.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Utility functions
async function readJsonFile(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error.message);
    // If file doesn't exist, create it with default value
    if (error.code === 'ENOENT') {
      try {
        await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
        console.log(`Created ${filePath} with default value`);
      } catch (writeError) {
        console.error(`Failed to create ${filePath}:`, writeError.message);
      }
    }
    return defaultValue;
  }
}

// Simulate price movement over time
function simulatePriceMovement(currentPrice, fairValue, days = 30, volatility = 0.02) {
  const prices = [currentPrice];
  let price = currentPrice;

  for (let day = 1; day <= days; day++) {
    // Move gradually toward fair value with volatility
    const priceDiff = fairValue - price;
    const maxDailyMovement = price * 2.0; // Max 200% movement per day
    const dailyMovement = maxDailyMovement / 1440; // Per minute movement
    const maxChange = Math.min(Math.abs(priceDiff), dailyMovement * 1440); // Daily max

    let change;
    if (Math.abs(priceDiff) < dailyMovement * 1440) {
      // Close to target, small volatility
      change = priceDiff + (Math.random() - 0.5) * (price * volatility);
    } else {
      // Far from target, move toward it with volatility
      const direction = priceDiff > 0 ? 1 : -1;
      change = direction * maxChange + (Math.random() - 0.5) * (price * volatility);
    }

    price = Math.max(0.01, price + change);
    prices.push(price);
  }

  return prices;
}

// Main analysis function
async function analyzeStockValuation() {
  try {
    console.log('🔍 Analyzing Stock Valuations...\n');

    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});

    // Fetch external data (simplified version)
    let externalData = {};
    try {
      const response = await axios.get('https://createranked.oreostack.uk/api/authors.json');
      if (response.data && response.data.authors) {
        externalData = response.data.authors.reduce((acc, author) => {
          acc[author.name.toLowerCase()] = author;
          return acc;
        }, {});
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch external data, using cached values');
    }

    const analysis = [];
    let totalOvervaluation = 0;
    let totalUndervaluation = 0;

    for (const author of authors) {
      const { ticker, name, curseforgeId } = author;
      const stockHistory = history[ticker] || [];

      // Get current price
      let currentPrice = 100;
      if (stockHistory.length > 0) {
        const latest = stockHistory[stockHistory.length - 1];
        currentPrice = latest.price || 100;
      }

      // Get fair value from external data
      let fairValue = currentPrice; // Default to current price
      let downloads = 0;
      let downloadRate = 0;

      const extAuthor = externalData[curseforgeId.toLowerCase()];
      if (extAuthor) {
        downloads = extAuthor.downloadCount || 0;
        downloadRate = extAuthor.downloadRate || 0;
        fairValue = convertDownloadsToPrice(downloads, downloadRate);
      }

      // Calculate over/under valuation
      const valuationDiff = ((currentPrice - fairValue) / fairValue) * 100;
      const isOvervalued = valuationDiff > 5;
      const isUndervalued = valuationDiff < -5;

      // Simulate future prices
      const futurePrices = simulatePriceMovement(currentPrice, fairValue, 30);
      const projectedPrice = futurePrices[futurePrices.length - 1];
      const projectedChange = ((projectedPrice - currentPrice) / currentPrice) * 100;

      const stockAnalysis = {
        ticker,
        name,
        currentPrice: currentPrice.toFixed(2),
        fairValue: fairValue.toFixed(2),
        valuation: valuationDiff.toFixed(2) + '%',
        status: isOvervalued ? '🚨 OVERVALUED' : isUndervalued ? '💎 UNDERVALUED' : '✅ FAIR',
        downloads,
        downloadRate: downloadRate.toFixed(2),
        projectedPrice: projectedPrice.toFixed(2),
        projectedChange: projectedChange.toFixed(2) + '%',
        confidence: extAuthor ? 'HIGH' : 'LOW'
      };

      analysis.push(stockAnalysis);

      if (isOvervalued) totalOvervaluation++;
      if (isUndervalued) totalUndervaluation++;
    }

    // Sort by valuation difference (most overvalued first)
    analysis.sort((a, b) => {
      const aVal = parseFloat(a.valuation);
      const bVal = parseFloat(b.valuation);
      return bVal - aVal;
    });

    // Display results
    console.log('📊 STOCK VALUATION ANALYSIS');
    console.log('=' .repeat(80));
    console.log(`Total Stocks: ${authors.length}`);
    console.log(`Overvalued (>5%): ${totalOvervaluation}`);
    console.log(`Undervalued (<-5%): ${totalUndervaluation}`);
    console.log(`Fair Value (±5%): ${authors.length - totalOvervaluation - totalUndervaluation}`);
    console.log('=' .repeat(80));

    console.log('\n📈 DETAILED ANALYSIS:');
    console.log('TICKER | NAME | CURRENT | FAIR | VALUATION | STATUS | PROJECTED | CONFIDENCE');
    console.log('-'.repeat(100));

    analysis.forEach(stock => {
      console.log(
        `${stock.ticker.padEnd(6)} | ` +
        `${stock.name.substring(0, 15).padEnd(15)} | ` +
        `$${stock.currentPrice.padEnd(7)} | ` +
        `$${stock.fairValue.padEnd(6)} | ` +
        `${stock.valuation.padEnd(9)} | ` +
        `${stock.status.padEnd(12)} | ` +
        `${stock.projectedChange.padEnd(10)} | ` +
        `${stock.confidence}`
      );
    });

    // Summary insights
    console.log('\n💡 KEY INSIGHTS:');
    const overvaluedStocks = analysis.filter(s => s.status.includes('OVERVALUED'));
    const undervaluedStocks = analysis.filter(s => s.status.includes('UNDERVALUED'));

    if (overvaluedStocks.length > 0) {
      console.log(`🚨 TOP OVERVALUED: ${overvaluedStocks.slice(0, 3).map(s => s.ticker).join(', ')}`);
    }

    if (undervaluedStocks.length > 0) {
      console.log(`💎 TOP UNDERVALUED: ${undervaluedStocks.slice(0, 3).map(s => s.ticker).join(', ')}`);
    }

    // Market sentiment
    const avgValuation = analysis.reduce((sum, stock) => sum + parseFloat(stock.valuation), 0) / analysis.length;
    console.log(`📊 MARKET SENTIMENT: ${avgValuation > 0 ? 'BEARISH' : 'BULLISH'} (Avg: ${avgValuation.toFixed(2)}%)`);

    return analysis;

  } catch (error) {
    console.error('❌ Error analyzing stocks:', error);
    throw error;
  }
}

// Predict specific stock future
async function predictStockFuture(ticker, days = 30) {
  try {
    console.log(`🔮 Predicting ${ticker} for ${days} days...\n`);

    const authors = await readJsonFile(AUTHORS_FILE, []);
    const history = await readJsonFile(HISTORY_FILE, {});

    const author = authors.find(a => a.ticker === ticker);
    if (!author) {
      throw new Error(`Stock ${ticker} not found`);
    }

    const stockHistory = history[ticker] || [];
    let currentPrice = 100;
    if (stockHistory.length > 0) {
      currentPrice = stockHistory[stockHistory.length - 1].price || 100;
    }

    // Get fair value
    let fairValue = currentPrice;
    try {
      const response = await axios.get('https://createranked.oreostack.uk/api/authors.json');
      if (response.data && response.data.authors) {
        const extAuthor = response.data.authors.find(a => a.name.toLowerCase() === author.curseforgeId.toLowerCase());
        if (extAuthor) {
          fairValue = convertDownloadsToPrice(extAuthor.downloadCount, extAuthor.downloadRate);
        }
      }
    } catch (error) {
      console.warn('Using current price as fair value');
    }

    // Simulate multiple scenarios
    const scenarios = [];
    for (let i = 0; i < 5; i++) {
      scenarios.push(simulatePriceMovement(currentPrice, fairValue, days));
    }

    console.log(`📈 ${ticker} PRICE PREDICTION (${days} days)`);
    console.log('='.repeat(50));
    console.log(`Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`Fair Value: $${fairValue.toFixed(2)}`);
    console.log(`Current Status: ${((currentPrice - fairValue) / fairValue * 100).toFixed(2)}% ${currentPrice > fairValue ? 'overvalued' : 'undervalued'}`);
    console.log('');

    // Show price ranges
    const finalPrices = scenarios.map(s => s[s.length - 1]);
    const minPrice = Math.min(...finalPrices);
    const maxPrice = Math.max(...finalPrices);
    const avgPrice = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;

    console.log('🎯 PREDICTED PRICE RANGE:');
    console.log(`Low: $${minPrice.toFixed(2)} (${((minPrice - currentPrice) / currentPrice * 100).toFixed(2)}%)`);
    console.log(`Average: $${avgPrice.toFixed(2)} (${((avgPrice - currentPrice) / currentPrice * 100).toFixed(2)}%)`);
    console.log(`High: $${maxPrice.toFixed(2)} (${((maxPrice - currentPrice) / currentPrice * 100).toFixed(2)}%)`);

    return {
      ticker,
      currentPrice,
      fairValue,
      predictions: {
        min: minPrice,
        average: avgPrice,
        max: maxPrice
      },
      scenarios
    };

  } catch (error) {
    console.error(`❌ Error predicting ${ticker}:`, error);
    throw error;
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run full analysis
    await analyzeStockValuation();
  } else if (args[0] === 'predict' && args[1]) {
    // Predict specific stock
    const ticker = args[1].toUpperCase();
    const days = args[2] ? parseInt(args[2]) : 30;
    await predictStockFuture(ticker, days);
  } else {
    console.log('Usage:');
    console.log('  node stock-analyzer.js                    # Full market analysis');
    console.log('  node stock-analyzer.js predict TICKER     # Predict specific stock (30 days)');
    console.log('  node stock-analyzer.js predict TICKER DAYS # Predict specific stock (custom days)');
  }
}

// Export functions for use as module
export {
  analyzeStockValuation,
  predictStockFuture
};

main().catch(console.error);
