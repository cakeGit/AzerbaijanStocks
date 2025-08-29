import React from 'react';
import { useNavigate } from 'react-router-dom';
import TickerTape from '../components/TickerTape';
import ParallaxCandlestickChart from '../components/ParallaxCandlestickChart';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Ticker Tape */}
      <TickerTape />

      {/* Parallax Candlestick Background */}
      <ParallaxCandlestickChart />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto drop-shadow-md">
            Trade stocks from the top create mod authors. Prices are based on real curseforge download counts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-8">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold text-lg hover:bg-secondary/80 transition-colors shadow-lg hover:shadow-xl border border-border"
            >
              Sign Up
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground text-sm">
            <p>Each stock represents a Minecraft mod author. Stock prices are based on their mod download counts and community engagement.</p>
            <p className="mt-2">
              This is a simulation and not real financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
