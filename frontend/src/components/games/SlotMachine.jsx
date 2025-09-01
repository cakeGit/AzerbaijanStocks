import React, { useState, useEffect } from 'react';

const SlotMachine = () => {
  const symbols = ['📈', '💰', '📉', '📊', '💸'];
  const [reels, setReels] = useState([
    { symbols: ['📈', '💰', '📉'], position: 0, spinning: false },
    { symbols: ['📊', '💸', '📈'], position: 0, spinning: false },
    { symbols: ['💰', '📉', '📊'], position: 0, spinning: false }
  ]);
  const [balance, setBalance] = useState(100);
  const [bet, setBet] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');

  const spin = () => {
    const betAmount = parseInt(bet || 0);
    if (balance < betAmount || spinning || betAmount <= 0) return;
    setSpinning(true);
    setBalance(balance - betAmount);
    setMessage('');

    // Start spinning all reels
    setReels(prev => prev.map(reel => ({ ...reel, spinning: true })));

    // Stop reels one by one with delay
    setTimeout(() => stopReel(0), 1000);
    setTimeout(() => stopReel(1), 1500);
    setTimeout(() => stopReel(2), 2000);
  };

  const stopReel = (reelIndex) => {
    setReels(prev => {
      const newReels = [...prev];
      const finalSymbols = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];
      newReels[reelIndex] = { symbols: finalSymbols, position: 0, spinning: false };
      return newReels;
    });

    // Check win when all reels stopped
    if (reelIndex === 2) {
      setTimeout(() => {
        setSpinning(false);
        const finalReels = reels.map(reel => reel.symbols[1]); // Middle symbol of each reel
        const betAmount = parseInt(bet || 0);

        if (finalReels.every(symbol => symbol === finalReels[0])) {
          const win = betAmount * 10;
          setBalance(prev => prev + win);
          setMessage(`Jackpot! You won $${win}!`);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
          const win = betAmount * 2;
          setBalance(prev => prev + win);
          setMessage(`You won $${win}!`);
        } else {
          setMessage('Try again!');
        }
      }, 500);
    }
  };

  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        setReels(prev => prev.map(reel => {
          if (!reel.spinning) return reel;
          const newSymbols = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
          ];
          return { ...reel, symbols: newSymbols };
        }));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [spinning]);

  return (
    <div className="slot-machine bg-gradient-to-b from-purple-900 to-blue-900 p-8 text-center text-white border-4 border-yellow-400 rounded-2xl">
      <h1 className="text-5xl font-bold mb-8 text-yellow-300 drop-shadow-lg">🎰 Slot Machine 🎰</h1>
      <div className="reels flex justify-center space-x-8 mb-8">
        {reels.map((reel, index) => (
          <div key={index} className={`reel text-7xl border-4 border-yellow-400 bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl w-24 h-24 flex flex-col items-center justify-center overflow-hidden relative`}>
            <div className={`flex flex-col transition-transform duration-100 ${reel.spinning ? 'animate-bounce' : ''}`}>
              {reel.symbols.map((symbol, symbolIndex) => (
                <div key={symbolIndex} className="h-8 flex items-center justify-center">
                  {symbol}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="controls mb-6 bg-black bg-opacity-50 rounded-lg p-6 inline-block border-2 border-white">
        <label className="mr-6 text-lg">
          Bet:
          <input
            type="number"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            min="1"
            max={balance}
            className="ml-2 p-3 border-2 border-yellow-300 rounded bg-gray-800 text-white text-lg"
            placeholder="Enter bet"
          />
        </label>
        <button
          onClick={spin}
          disabled={spinning || !bet || parseInt(bet) <= 0 || balance < parseInt(bet || 0)}
          className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 font-bold text-lg shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {spinning ? '🎰 Spinning...' : '🎰 Spin'}
        </button>
      </div>
      {message && <p className={`text-2xl font-bold mt-4 p-4 rounded-lg inline-block ${message.includes('Jackpot') ? 'bg-yellow-500 text-black' : message.includes('won') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{message}</p>}
    </div>
  );
};

export default SlotMachine;
