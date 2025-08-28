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
      <div className="animate-ticker flex items-center space-x-8">
        {stocks.concat(stocks).map((stock, index) => (
          <span key={`${stock.ticker}-${index}`} className="flex items-center space-x-2 whitespace-nowrap">
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
