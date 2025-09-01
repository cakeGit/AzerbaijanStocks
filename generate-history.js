const fs = require('fs').promises;
const path = require('path');

async function writeJsonFile(filePath, data) {
  try {
    // Create atomic write by writing to temp file first
    const tempFile = `${filePath}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    
    // Write to temp file
    await fs.writeFile(tempFile, jsonString);
    
    // Atomic move (rename) to final location
    await fs.rename(tempFile, filePath);
    
    console.log(`Successfully wrote ${filePath}`);
  } catch (error) {
    console.error(`Failed to write ${filePath}:`, error.message);
    // Clean up temp file if it exists
    try {
      await fs.unlink(`${filePath}.tmp`);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

async function generateHistoricalData() {
  const dataDir = path.join(__dirname, 'data');
  const historyFile = path.join(dataDir, 'history.json');

  // Read existing data
  let existingHistory = {};
  try {
    const data = await fs.readFile(historyFile, 'utf8');
    existingHistory = JSON.parse(data);
  } catch (error) {
  }

  // Generate data for the past year
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const tickers = ['AZT', 'CTD', 'KPT', 'SPY', 'DRP'];

  for (const ticker of tickers) {

    const history = existingHistory[ticker] || [];
    const newHistory = [];

    // Generate hourly data for the past year
    let currentTime = new Date(oneYearAgo);

    while (currentTime <= now) {
      // Use a deterministic seed based on ticker and time for consistent data
      const seed = (ticker.charCodeAt(0) + currentTime.getTime()) % 1000;
      const random = (seed / 1000);

      // Base price varies by ticker
      const basePrices = { AZT: 100, CTD: 100, KPT: 100, SPY: 100, DRP: 100 };
      const basePrice = basePrices[ticker] || 100;

      // Add some trend and seasonality
      const daysSinceStart = Math.floor((currentTime - oneYearAgo) / (24 * 60 * 60 * 1000));
      const trend = Math.sin(daysSinceStart / 30) * 0.1; // Monthly cycle
      const seasonal = Math.sin(daysSinceStart / 365 * 2 * Math.PI) * 0.05; // Yearly cycle

      // Generate price with trend and volatility
      const volatility = 0.02; // 2% volatility
      const priceChange = (random - 0.5) * volatility + trend * 0.001 + seasonal * 0.001;
      const price = Math.max(0.01, basePrice * (1 + priceChange));

      // Generate volume
      const baseVolume = ticker === 'DRP' ? 400000 : ticker === 'CTD' ? 300000 : 50000;
      const volume = Math.floor(baseVolume * (0.5 + random));

      // Calculate change from previous price
      const prevPrice = newHistory.length > 0 ? newHistory[newHistory.length - 1].price : basePrice;
      const change = ((price - prevPrice) / prevPrice) * 100;

      newHistory.push({
        timestamp: currentTime.toISOString(),
        price: parseFloat(price.toFixed(2)),
        volume: volume,
        change: parseFloat(change.toFixed(2))
      });

      // Move to next hour
      currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // +1 hour
    }

    // Combine with existing recent data (avoid duplicates)
    const combinedHistory = [...newHistory];

    // Add existing data that's newer than our generated data
    const latestGenerated = new Date(newHistory[newHistory.length - 1].timestamp);
    for (const entry of history) {
      const entryTime = new Date(entry.timestamp);
      if (entryTime > latestGenerated) {
        combinedHistory.push(entry);
      }
    }

    // Sort by timestamp
    combinedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    existingHistory[ticker] = combinedHistory;
  }

  // Write back to file
  await writeJsonFile(historyFile, existingHistory);
}

// Run the script
generateHistoricalData().catch(console.error);
