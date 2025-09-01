import React, { useState } from 'react';

const Roulette = () => {
  const numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const [balance, setBalance] = useState(100);
  const [bets, setBets] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const placeBet = (type, value, amount) => {
    if (balance < amount) return;
    setBets([...bets, { type, value, amount }]);
    setBalance(balance - amount);
  };

  const spin = () => {
    if (bets.length === 0 || spinning) return;
    setSpinning(true);
    setResult(null);
    setMessage('');

    setTimeout(() => {
      const winningNumber = numbers[Math.floor(Math.random() * numbers.length)];
      setResult(winningNumber);
      setSpinning(false);

      let winnings = 0;
      bets.forEach(bet => {
        if (bet.type === 'number' && bet.value === winningNumber) {
          winnings += bet.amount * 35;
        } else if (bet.type === 'color') {
          const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
          const isRed = redNumbers.includes(winningNumber);
          if ((bet.value === 'red' && isRed) || (bet.value === 'black' && !isRed && winningNumber !== 0)) {
            winnings += bet.amount * 2;
          }
        }
        // Add more bet types if needed
      });

      setBalance(balance + winnings);
      setBets([]);
      setMessage(winnings > 0 ? `You won $${winnings}!` : 'No win this time.');
    }, 3000);
  };

  return (
    <div className="roulette p-8 text-center">
      <h1 className="text-4xl font-bold mb-8">🎡 Roulette</h1>
      <p className="text-lg mb-4">Balance: ${balance}</p>
      <div className="wheel mb-8">
        <div className={`wheel-circle ${spinning ? 'spinning' : ''}`}>
          {numbers.map((num, index) => (
            <div key={index} className="number" style={{ transform: `rotate(${index * (360 / numbers.length)}deg)` }}>
              {num}
            </div>
          ))}
        </div>
        {result !== null && <p className="result text-2xl font-bold">Winning Number: {result}</p>}
      </div>
      <div className="bets mb-4">
        <h2 className="text-2xl mb-4">Place Bets</h2>
        <div className="flex justify-center space-x-4 mb-4">
          <button onClick={() => placeBet('color', 'red', 10)} className="px-4 py-2 bg-red-500 text-white rounded">Bet Red $10</button>
          <button onClick={() => placeBet('color', 'black', 10)} className="px-4 py-2 bg-black text-white rounded">Bet Black $10</button>
        </div>
        <div className="mb-4">
          <input type="number" placeholder="Number" id="betNumber" className="p-2 border rounded mr-2" />
          <input type="number" placeholder="Amount" id="betAmount" className="p-2 border rounded mr-2" />
          <button onClick={() => {
            const num = parseInt(document.getElementById('betNumber').value);
            const amt = parseInt(document.getElementById('betAmount').value);
            if (!isNaN(num) && !isNaN(amt)) placeBet('number', num, amt);
          }} className="px-4 py-2 bg-blue-500 text-white rounded">Bet on Number</button>
        </div>
      </div>
      <button onClick={spin} disabled={spinning || bets.length === 0} className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
        {spinning ? 'Spinning...' : 'Spin'}
      </button>
      {message && <p className="text-xl font-semibold mt-4">{message}</p>}
      <div className="current-bets mt-4">
        <h3>Current Bets:</h3>
        {bets.map((bet, index) => (
          <p key={index}>{bet.type}: {bet.value} - ${bet.amount}</p>
        ))}
      </div>
    </div>
  );
};

export default Roulette;
