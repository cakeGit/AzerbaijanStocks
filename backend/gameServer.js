const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const gameServer = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GAMES_DIR = path.join(__dirname, '..', 'data', 'games');

// Ensure games directory exists
async function ensureGamesDir() {
  try {
    await fs.mkdir(GAMES_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating games directory:', error);
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to read game data
async function readGameData(gameName) {
  try {
    const filePath = path.join(GAMES_DIR, `${gameName}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { scores: [], leaderboard: [] };
  }
}

// Helper function to write game data
async function writeGameData(gameName, data) {
  try {
    const filePath = path.join(GAMES_DIR, `${gameName}.json`);
    // Create atomic write by writing to temp file first
    const tempFile = `${filePath}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    
    // Write to temp file
    await fs.writeFile(tempFile, jsonString);
    
    // Atomic move (rename) to final location
    await fs.rename(tempFile, filePath);
    
    console.log(`Successfully wrote game data for ${gameName}`);
  } catch (error) {
    console.error('Error writing game data:', error);
    // Clean up temp file if it exists
    try {
      await fs.unlink(`${filePath}.tmp`);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

// POST /api/games/:gameName/score - Submit a score
gameServer.post('/:gameName/score', authenticateToken, async (req, res) => {
  try {
    const { gameName } = req.params;
    const { score, details } = req.body;
    const userId = req.user.id;
    const username = req.user.username || req.user.email || 'Anonymous';

    if (!score || typeof score !== 'number') {
      return res.status(400).json({ error: 'Valid score required' });
    }

    await ensureGamesDir();
    const gameData = await readGameData(gameName);

    // Add new score
    const newScore = {
      id: Date.now().toString(),
      userId,
      username,
      score,
      details: details || {},
      timestamp: new Date().toISOString()
    };

    gameData.scores.push(newScore);

    // Update leaderboard (top 10 scores)
    gameData.leaderboard = gameData.scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    await writeGameData(gameName, gameData);

    res.json({ message: 'Score submitted successfully', score: newScore });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// GET /api/games/:gameName/leaderboard - Get leaderboard
gameServer.get('/:gameName/leaderboard', async (req, res) => {
  try {
    const { gameName } = req.params;
    const gameData = await readGameData(gameName);

    res.json({
      game: gameName,
      leaderboard: gameData.leaderboard,
      totalScores: gameData.scores.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/games/:gameName/user-scores - Get user's scores for a game
gameServer.get('/:gameName/user-scores', authenticateToken, async (req, res) => {
  try {
    const { gameName } = req.params;
    const userId = req.user.id;
    const gameData = await readGameData(gameName);

    const userScores = gameData.scores
      .filter(score => score.userId === userId)
      .sort((a, b) => b.score - a.score);

    res.json({
      game: gameName,
      userScores,
      bestScore: userScores.length > 0 ? userScores[0] : null
    });
  } catch (error) {
    console.error('Error fetching user scores:', error);
    res.status(500).json({ error: 'Failed to fetch user scores' });
  }
});

// GET /api/games - List all games with basic stats
gameServer.get('/', async (req, res) => {
  try {
    const games = ['slots', 'blackjack', 'roulette', 'mines', 'mcking', 'secretary'];
    const gameStats = {};

    for (const game of games) {
      const gameData = await readGameData(game);
      gameStats[game] = {
        totalScores: gameData.scores.length,
        topScore: gameData.leaderboard.length > 0 ? gameData.leaderboard[0].score : 0
      };
    }

    res.json({ games: gameStats });
  } catch (error) {
    console.error('Error fetching games stats:', error);
    res.status(500).json({ error: 'Failed to fetch games stats' });
  }
});

module.exports = gameServer;
