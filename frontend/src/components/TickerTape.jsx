import React from 'react';
import { useStocks } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatChange, getChangeColor } from '../utils/formatting';

const TickerTape = () => {
  const { stocks, loading } = useStocks();
  const { isDarkMode } = useTheme();

  if (loading || stocks.length === 0) {
    return (
      <div className="ticker-container">
        <div className="animate-ticker flex items-center space-x-8">
          <span>Loading market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ticker-container">
      <div className="animate-ticker flex items-center">
        {/* First set of stocks */}
        {stocks.map((stock, index) => (
          <span key={`${stock.ticker}-${index}`} className="flex items-center space-x-2 whitespace-nowrap mx-8">
            <span className="font-bold">{stock.ticker}</span>
            <span>{formatCurrency(stock.price)}</span>
            <span className={getChangeColor(stock.change, isDarkMode)}>
              {formatChange(stock.change)}
            </span>
          </span>
        ))}
        {/* Duplicate set for seamless looping */}
        {stocks.map((stock, index) => (
          <span key={`${stock.ticker}-duplicate-${index}`} className="flex items-center space-x-2 whitespace-nowrap mx-8">
            <span className="font-bold">{stock.ticker}</span>
            <span>{formatCurrency(stock.price)}</span>
            <span className={getChangeColor(stock.change, isDarkMode)}>
              {formatChange(stock.change)}
            </span>
          </span>
        ))}
        {/* Third set to ensure full coverage */}
        {stocks.map((stock, index) => (
          <span key={`${stock.ticker}-third-${index}`} className="flex items-center space-x-2 whitespace-nowrap mx-8">
            <span className="font-bold">{stock.ticker}</span>
            <span>{formatCurrency(stock.price)}</span>
            <span className={getChangeColor(stock.change, isDarkMode)}>
              {formatChange(stock.change)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerTape;
