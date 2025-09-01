import React, { useState, useEffect } from 'react';

const Mines = () => {
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState(new Set());
  const [mines, setMines] = useState(new Set());
  const [balance, setBalance] = useState(100);
  const [bet, setBet] = useState(10);
  const [difficulty, setDifficulty] = useState('easy'); // easy, medium, hard
  const [multiplier, setMultiplier] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');

  const difficulties = {
    easy: 0.1,
    medium: 0.2,
    hard: 0.3
  };

  const initializeGame = () => {
    const size = 7;
    const mineCount = Math.floor(size * size * difficulties[difficulty]);
    const newMines = new Set();
    while (newMines.size < mineCount) {
      const pos = Math.floor(Math.random() * (size * size));
      newMines.add(pos);
    }
    setMines(newMines);
    setRevealed(new Set());
    setMultiplier(1);
    setGameOver(false);
    setMessage('');
  };

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  const handleClick = (index) => {
    if (gameOver || revealed.has(index)) return;
    const newRevealed = new Set(revealed);
    newRevealed.add(index);
    setRevealed(newRevealed);

    if (mines.has(index)) {
      setGameOver(true);
      setMessage('Boom! Game over.');
    } else {
      setMultiplier(multiplier + 0.1);
      setBalance(balance + bet * 0.1);
      setMessage(`Safe! Multiplier: ${multiplier.toFixed(1)}x`);
    }
  };

  const cashOut = () => {
    if (revealed.size === 0) return;
    const winnings = bet * multiplier;
    setBalance(balance + winnings);
    setMessage(`Cashed out! Won $${winnings.toFixed(2)}`);
    initializeGame();
  };

  const renderGrid = () => {
    const size = 7;
    const cells = [];
    for (let i = 0; i < size * size; i++) {
      const isRevealed = revealed.has(i);
      const isMine = mines.has(i);
      cells.push(
        <button
          key={i}
          onClick={() => handleClick(i)}
          disabled={gameOver}
          className={`w-12 h-12 border rounded m-1 ${isRevealed ? (isMine ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-300'}`}
        >
          {isRevealed ? (isMine ? '💣' : '💎') : ''}
        </button>
      );
    }
    return cells;
  };

  return (
    <div className="mines game-card bg-card backdrop-blur-sm p-8 rounded-xl border border-border shadow-lg text-card-foreground mx-auto" style={{maxWidth: '720px', backgroundColor: 'var(--color-card)'}}>
      <h1 className="text-3xl font-semibold mb-4 text-card-foreground">💣 Mines</h1>
      <p className="text-sm text-muted-foreground mb-6">Click a tile to start the game</p>
      <p className="text-lg mb-4">Balance: ${balance.toFixed(2)}</p>
      <div className="mb-4">
        <label className="mr-4">
          Bet: 
          <input 
            type="number" 
            value={bet} 
            onChange={(e) => setBet(Math.max(1, Number(e.target.value)))} 
            min="1" 
            max={balance} 
            className="ml-2 p-2 border rounded bg-input text-card-foreground"
          />
        </label>
        <select 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)} 
          className="p-2 border rounded bg-input text-card-foreground"
          style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-card-foreground)' }}
        >
          <option value="easy" style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-card-foreground)' }}>Easy (10% mines)</option>
          <option value="medium" style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-card-foreground)' }}>Medium (20% mines)</option>
          <option value="hard" style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-card-foreground)' }}>Hard (30% mines)</option>
        </select>
      </div>
      {revealed.size === 0 && !gameOver && (
        <div className="mb-2 text-sm text-muted-foreground max-w-md mx-auto text-center">Click any tile on the grid to start — uncover safe tiles to increase your multiplier.</div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-4">
        {renderGrid()}
      </div>
      <div className="mb-4">
        <p>Multiplier: {multiplier.toFixed(1)}x</p>
        {/* Hide Cash Out until player has revealed at least one tile */}
        {revealed.size > 0 && !gameOver && (
          <button onClick={cashOut} className="px-6 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            Cash Out
          </button>
        )}
      </div>
      {message && <p className="text-xl font-semibold">{message}</p>}
      <button onClick={initializeGame} className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 mt-4">
        New Game
      </button>
    </div>
  );
};

export default Mines;
