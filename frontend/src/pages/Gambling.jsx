import React from 'react';
import { Link } from 'react-router-dom';

const Gambling = () => {
  return (
    <div className="gambling-page">
      <h1 className="text-4xl font-bold mb-8 text-center">Gambling 🤑</h1>
      <p className="mb-8 text-center text-lg">Try your luck with various gambling games. Note: These games are designed with a net loss of about 5% to keep things balanced.</p>

      <div className="space-y-8">
        {/* Slot Machine */}
        <div className="game-card bg-green-500/10 backdrop-blur-sm p-8 rounded-xl border border-border shadow-lg">
          <h2 className="text-3xl font-semibold mb-6 text-center">🎰 Slot Machine</h2>
          <p className="mb-6 text-center text-lg">Virtual reels with themed symbols (stock market icons). Simple spin mechanics and bonus rounds.</p>
          <div className="text-center">
            <Link to="/gambling/slots">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold">
                Play Slot Machine
              </button>
            </Link>
          </div>
        </div>

        {/* Blackjack */}
        <div className="game-card bg-purple-500/10 backdrop-blur-sm p-8 rounded-xl border border-border shadow-lg">
          <h2 className="text-3xl font-semibold mb-6 text-center">🃏 Blackjack</h2>
          <p className="mb-6 text-center text-lg">Classic card game with betting options, dealer AI, and progressive jackpots.</p>
          <div className="text-center">
            <Link to="/gambling/blackjack">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold">
                Play Blackjack
              </button>
            </Link>
          </div>
        </div>

        {/* Roulette */}
        <div className="game-card bg-yellow-500/10 backdrop-blur-sm p-8 rounded-xl border border-border shadow-lg">
          <h2 className="text-3xl font-semibold mb-6 text-center">🎡 Roulette</h2>
          <p className="mb-6 text-center text-lg">Wheel-based game with number, color, or group bets and live spin animations.</p>
          <div className="text-center">
            <Link to="/gambling/roulette">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold">
                Play Roulette
              </button>
            </Link>
          </div>
        </div>

        {/* Mines */}
        <div className="game-card bg-orange-500/10 backdrop-blur-sm p-8 rounded-xl border border-border shadow-lg">
          <h2 className="text-3xl font-semibold mb-6 text-center">💣 Mines</h2>
          <p className="mb-6 text-center text-lg">7x7 grid game where you choose difficulty for increasing returns. Click cells to reveal diamonds or bombs.</p>
          <div className="text-center">
            <Link to="/gambling/mines">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold">
                Play Mines
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gambling;
