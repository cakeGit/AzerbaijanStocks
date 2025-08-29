import React, { useState, useEffect } from 'react';
import { FaTimes, FaCoins, FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { stocksApi } from '../utils/api';

const QuickTradeModal = ({ stock, userId, isOpen, onClose }) => {
  const [tradeType, setTradeType] = useState('buy');
  const [quantity, setQuantity] = useState(1);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    try {
      const response = await stocksApi.getUserData(userId);
      setUserData(response.data);
    } catch (error) {
      setError('Failed to fetch user data');
    }
  };

  const totalCost = quantity * stock.price;
  const currentShares = userData?.shares[stock.ticker] || 0;
  const maxBuyQuantity = Math.floor(userData?.cash / stock.price) || 0;
  const maxSellQuantity = currentShares;

  const canAfford = tradeType === 'buy' ? totalCost <= (userData?.cash || 0) : quantity <= maxSellQuantity;
  const newBalance = tradeType === 'buy'
    ? (userData?.cash || 0) - totalCost
    : (userData?.cash || 0) + totalCost;

  const handleTrade = async () => {
    if (!canAfford) {
      setError(`Insufficient ${tradeType === 'buy' ? 'funds' : 'shares'}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiFunction = tradeType === 'buy' ? stocksApi.buyStock : stocksApi.sellStock;
      const response = await apiFunction(stock.ticker, parseInt(quantity));

      setSuccess(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${stock.ticker}`);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Simple refresh to update all components
      }, 1500);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Transaction failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMaxQuantity = () => {
    const maxQty = tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity;
    setQuantity(Math.max(1, maxQty));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" style={{ margin: 0 }}>
      <div className="bg-background border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl relative z-10">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold text-foreground">
            Quick Trade - {stock.ticker}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {/* Stock Info */}
          <div className="mb-6 p-4 bg-muted rounded-xs">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{stock.name}</h3>
                <p className="text-sm text-muted-foreground">{stock.ticker}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  ${stock.price.toFixed(2)}
                </div>
                <div className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {stock.change >= 0 ? <FaArrowUp className="inline mr-1" /> : <FaArrowDown className="inline mr-1" />}
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Current Holdings & Balance */}
          {userData && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="p-3 bg-accent/50 rounded-xs border border-accent-foreground/20">
                <div className="flex items-center text-sm mb-1 text-muted-foreground">
                  <FaCoins className="mr-1 text-yellow-600" />
                  Cash Balance
                </div>
                <div className="font-semibold text-accent-foreground">
                  ${userData.cash.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-accent/50 rounded-xs border border-accent">
                <div className="flex items-center text-sm mb-1 text-muted-foreground">
                  <FaChartLine className="mr-1 text-accent-foreground" />
                  Current Shares
                </div>
                <div className="font-semibold text-accent-foreground">
                  {currentShares} shares
                </div>
              </div>
            </div>
          )}

          {/* Trade Type Selection */}
          <div className="mb-4">
            <div className="flex rounded-xs border border-border overflow-hidden bg-muted">
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  tradeType === 'buy'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                onClick={() => setTradeType('buy')}
              >
                Buy
              </button>
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  tradeType === 'sell'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                onClick={() => setTradeType('sell')}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Quantity
            </label>
            <div className="flex">
              <input
                type="number"
                min="1"
                max={tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 border border-border rounded-l-xs px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              />
              <button
                onClick={handleMaxQuantity}
                className="px-3 py-2 border border-l-0 border-border rounded-r-xs bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Max
              </button>
            </div>
            <div className="text-xs mt-1 text-muted-foreground">
              Max {tradeType}: {tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity} shares
            </div>
          </div>

          {/* Trade Summary */}
          <div className="mb-6 p-4 bg-muted rounded-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total {tradeType === 'buy' ? 'Cost' : 'Revenue'}:</span>
              <span className="font-semibold text-foreground">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Balance:</span>
              <span className={`font-semibold ${canAfford ? 'text-green-600' : 'text-destructive'}`}>
                ${newBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 border border-destructive bg-destructive/10 rounded-xs text-destructive">
              <div className="text-sm">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 border border-accent bg-accent/10 rounded-xs text-accent-foreground">
              <div className="text-sm">{success}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border rounded-xs bg-background text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTrade}
              disabled={loading || !canAfford}
              className={`flex-1 py-2 px-4 rounded-xs font-medium transition-colors ${
                canAfford
                  ? tradeType === 'buy'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${quantity} Shares`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickTradeModal;
