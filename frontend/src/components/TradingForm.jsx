import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatting';
import { useTheme } from '../contexts/ThemeContext';
import { useStocks } from '../hooks/useApi';

const TradingForm = ({ stock, onTrade, loading, portfolio }) => {
  const [action, setAction] = useState('buy');
  const [shares, setShares] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const { isDarkMode } = useTheme();
  const { stocks } = useStocks();

  // Find current holdings for this stock
  const currentHolding = portfolio?.holdings?.find(h => h.ticker === stock.ticker);
  const ownedShares = currentHolding ? currentHolding.shares : 0;

  // Calculate portfolio values
  const holdingsValue = portfolio?.holdings?.reduce((total, holding) => {
    const stockData = stocks.find(s => s.ticker === holding.ticker);
    const currentPrice = stockData ? stockData.price : 0;
    return total + (holding.shares * currentPrice);
  }, 0) || 0;

  const totalPortfolioValue = (portfolio?.cash || 0) + holdingsValue;
  const currentStockValue = ownedShares * stock.price;
  const stockPercentage = totalPortfolioValue > 0 ? (currentStockValue / totalPortfolioValue) * 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double clicks
    
    const sharesNumber = parseInt(shares);
    if (!sharesNumber || sharesNumber <= 0) {
      setMessage('Please enter a valid number of shares');
      return;
    }

    // Validate selling shares
    if (action === 'sell' && sharesNumber > ownedShares) {
      setMessage(`You only own ${ownedShares} shares of ${stock.ticker}`);
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await onTrade(action, stock.ticker, sharesNumber, stock.price);
      if (result.success) {
        setMessage(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${sharesNumber} shares of ${stock.ticker}`);
        setShares('');
      } else {
        setMessage(result.error || 'Transaction failed');
      }
    } catch (error) {
      setMessage('Transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = shares ? parseFloat(shares) * stock.price : 0;
  const balanceAfterTransaction = action === 'buy' 
    ? (portfolio?.cash || 0) - totalCost 
    : (portfolio?.cash || 0) + totalCost;

  return (
    <div className="bg-card rounded-lg shadow-md border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          Trade {stock.ticker}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Action
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="buy"
                checked={action === 'buy'}
                onChange={(e) => setAction(e.target.value)}
                className="mr-2 text-primary"
              />
              <span className="text-sm text-foreground">Buy</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="sell"
                checked={action === 'sell'}
                onChange={(e) => setAction(e.target.value)}
                className="mr-2 text-primary"
              />
              <span className="text-sm text-foreground">Sell</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Number of Shares
          </label>
          <input
            type="number"
            min="1"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xs bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            placeholder="Enter number of shares"
            required
          />
        </div>

        <div className="bg-muted p-4 rounded-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Current Price:</span>
            <span className="text-sm font-medium text-foreground">{formatCurrency(stock.price)}</span>
          </div>
          {ownedShares > 0 && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">You Own:</span>
                <span className="text-sm font-medium text-foreground">{ownedShares} shares</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Portfolio %:</span>
                <span className="text-sm font-medium text-foreground">{stockPercentage.toFixed(2)}%</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Total {action === 'buy' ? 'Cost' : 'Value'}:</span>
            <span className="text-sm font-medium text-foreground">{formatCurrency(totalCost)}</span>
          </div>
          {shares && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Balance After:</span>
              <span className={`text-sm font-medium ${balanceAfterTransaction >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {formatCurrency(balanceAfterTransaction)}
              </span>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-xs ${
            message.includes('Successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || loading || !shares || (action === 'sell' && parseInt(shares) > ownedShares)}
          className={`w-full py-2 px-4 rounded-xs font-medium transition-colors ${
            action === 'buy'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          } ${
            (isSubmitting || loading || !shares || (action === 'sell' && parseInt(shares) > ownedShares)) 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          {isSubmitting ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} Shares`}
        </button>
      </form>
    </div>
  );
};

export default TradingForm;
