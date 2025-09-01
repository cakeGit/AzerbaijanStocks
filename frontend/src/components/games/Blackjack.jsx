import React, { useState, useEffect } from 'react';

const Blackjack = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [balance, setBalance] = useState(100);
  const [bet, setBet] = useState(10);
  const [gameState, setGameState] = useState('betting'); // betting, playing, dealer, end
  const [message, setMessage] = useState('');

  const createDeck = () => {
    const newDeck = [];
    for (let suit of suits) {
      for (let rank of ranks) {
        newDeck.push({ suit, rank });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
  };

  const getHandValue = (hand) => {
    let value = 0;
    let aces = 0;
    for (let card of hand) {
      value += getCardValue(card);
      if (card.rank === 'A') aces++;
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  };

  const dealCard = (hand) => {
    const newDeck = [...deck];
    const card = newDeck.pop();
    setDeck(newDeck);
    return [...hand, card];
  };

  const startGame = () => {
    if (balance < bet) return;
    setBalance(balance - bet);
    const newDeck = createDeck();
    setDeck(newDeck);
    setPlayerHand([newDeck[0], newDeck[2]]);
    setDealerHand([newDeck[1], newDeck[3]]);
    setDeck(newDeck.slice(4));
    setGameState('playing');
    setMessage('');
  };

  const hit = () => {
    const newHand = dealCard(playerHand);
    setPlayerHand(newHand);
    if (getHandValue(newHand) > 21) {
      setGameState('end');
      setMessage('Bust! You lose.');
    }
  };

  const stand = () => {
    setGameState('dealer');
    dealerPlay();
  };

  const dealerPlay = () => {
    let newDealerHand = [...dealerHand];
    while (getHandValue(newDealerHand) < 17) {
      newDealerHand = dealCard(newDealerHand);
    }
    setDealerHand(newDealerHand);
    setGameState('end');
    const playerValue = getHandValue(playerHand);
    const dealerValue = getHandValue(newDealerHand);
    if (dealerValue > 21 || playerValue > dealerValue) {
      setBalance(balance + bet * 2);
      setMessage('You win!');
    } else if (playerValue === dealerValue) {
      setBalance(balance + bet);
      setMessage('Push!');
    } else {
      setMessage('Dealer wins!');
    }
  };

  const resetGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setMessage('');
  };

  return (
    <div className="blackjack min-h-screen bg-gradient-to-b from-green-800 to-green-900 p-8 text-white flex items-start justify-center">
      <div className="w-full mx-auto px-6 max-w-full">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-5xl font-extrabold text-yellow-300 drop-shadow-md flex items-center gap-3">🃏 <span>Blackjack</span></h1>
          <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-md font-medium border border-yellow-300">Balance: <span className="font-bold text-yellow-300">${balance}</span></div>
        </header>

        {gameState === 'betting' && (
          <div className="mb-8 bg-black bg-opacity-60 rounded-xl p-6 shadow-lg flex items-center justify-between gap-6 border border-yellow-300">
            <div className="flex items-center gap-4">
              <label className="text-lg font-medium text-yellow-200">Bet</label>
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(Math.max(1, Number(e.target.value)))}
                min="1"
                max={balance}
                className="w-32 p-3 border-2 border-yellow-300 rounded-lg bg-gray-900 text-white text-lg text-center"
              />
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 font-bold text-lg shadow-lg transform hover:scale-105 transition-all border border-yellow-300"
            >
              Deal Cards
            </button>
          </div>
        )}

        <div className="mb-8 bg-black bg-opacity-70 rounded-xl p-6 shadow-xl border border-black">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-semibold text-yellow-300">Dealer</h2>
              <div className="text-lg font-medium bg-gray-900 bg-opacity-60 px-3 py-1 rounded">{gameState === 'playing' && dealerHand.length > 0 ? '??' : getHandValue(dealerHand)}</div>
            </div>
            <div className="flex justify-center space-x-6">
              {dealerHand.map((card, index) => {
                const isFaceDown = gameState === 'playing' && index === 0;
                return (
                  <div
                    key={index}
                    className={`card w-28 sm:w-32 md:w-36 lg:w-44 h-36 sm:h-40 md:h-44 rounded-lg shadow-2xl border-4 flex flex-col justify-between p-4 transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} transition-transform bg-white`}
                  >
                    {isFaceDown ? (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-yellow-300 font-bold bg-gradient-to-b from-gray-800 to-gray-900 rounded">🂠</div>
                    ) : (
                      <>
                        <div className={`text-left font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>{card.rank}</div>
                        <div className={`text-5xl text-center ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>{card.suit}</div>
                        <div className={`text-right font-bold rotate-180 ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>{card.rank}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-semibold text-yellow-300">Player</h2>
              <div className="text-lg font-medium bg-gray-900 bg-opacity-60 px-3 py-1 rounded">{getHandValue(playerHand)}</div>
            </div>
            <div className="flex justify-center space-x-6">
              {playerHand.map((card, index) => (
                <div key={index} className={`card w-28 sm:w-32 md:w-36 lg:w-44 h-36 sm:h-40 md:h-44 bg-white rounded-lg border-4 flex flex-col justify-between p-4 transform ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'} transition-transform shadow-2xl`}>
                  <div className={`text-left font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>{card.rank}</div>
                  <div className={`text-6xl text-center ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>{card.suit}</div>
                  <div className={`text-right font-bold rotate-180 ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>{card.rank}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            {gameState === 'playing' && (
              <>
                <button onClick={hit} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold shadow-lg transform hover:scale-105 transition-all">Hit</button>
                <button onClick={stand} className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 font-bold shadow-lg transform hover:scale-105 transition-all">Stand</button>
              </>
            )}
            {gameState === 'end' && (
              <button onClick={resetGame} className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 font-bold shadow-lg transform hover:scale-105 transition-all">New Game</button>
            )}
          </div>
        </div>

        {message && <p className="text-2xl font-bold bg-black bg-opacity-70 rounded-lg p-4 inline-block mt-2 text-center">{message}</p>}
      </div>
    </div>
  );
};

export default Blackjack;
