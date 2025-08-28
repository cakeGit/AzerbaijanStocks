import React, { useState, useEffect } from 'react';
import { FaTimes, FaCoins, FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { stocksApi } from '../utils/api';

const QuickTradeModal = ({ stock, userId, isOpen, onClose }) => {
  const [tradeType, setTradeType] = useState('buy');
  const [quantity, setQuantity] = useState(1);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
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
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ margin: 0 }}>
      <div className={`rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Trade - {stock.ticker}
          </h2>
          <button
            onClick={onClose}
            className={isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {/* Stock Info */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stock.ticker}</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${stock.price.toFixed(2)}
                </div>
                <div className={`text-sm ${stock.change >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {stock.change >= 0 ? <FaArrowUp className="inline mr-1" /> : <FaArrowDown className="inline mr-1" />}
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Current Holdings & Balance */}
          {userData && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <div className={`flex items-center text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaCoins className={`mr-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  Cash Balance
                </div>
                <div className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  ${userData.cash.toFixed(2)}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                <div className={`flex items-center text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaChartLine className={`mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  Current Shares
                </div>
                <div className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {currentShares} shares
                </div>
              </div>
            </div>
          )}

          {/* Trade Type Selection */}
          <div className="mb-4">
            <div className={`flex rounded-lg border overflow-hidden ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  tradeType === 'buy'
                    ? `${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'} text-white`
                    : `${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`
                }`}
                onClick={() => setTradeType('buy')}
              >
                Buy
              </button>
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  tradeType === 'sell'
                    ? `${isDarkMode ? 'bg-red-700' : 'bg-red-600'} text-white`
                    : `${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`
                }`}
                onClick={() => setTradeType('sell')}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Quantity
            </label>
            <div className="flex">
              <input
                type="number"
                min="1"
                max={tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className={`flex-1 border rounded-l-md px-3 py-2 focus:ring-2 focus:ring-azt-blue focus:border-azt-blue ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                    : 'border-gray-300 bg-white'
                }`}
              />
              <button
                onClick={handleMaxQuantity}
                className={`px-3 py-2 border border-l-0 rounded-r-md text-sm ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Max
              </button>
            </div>
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Max {tradeType}: {tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity} shares
            </div>
          </div>

          {/* Trade Summary */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total {tradeType === 'buy' ? 'Cost' : 'Revenue'}:</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>New Balance:</span>
              <span className={`font-semibold ${canAfford ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                ${newBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className={`mb-4 p-3 border rounded-md ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <div className="text-sm">{error}</div>
            </div>
          )}

          {success && (
            <div className={`mb-4 p-3 border rounded-md ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <div className="text-sm">{success}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`flex-1 py-2 px-4 border rounded-md ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleTrade}
              disabled={loading || !canAfford}
              className={`flex-1 py-2 px-4 rounded-md font-medium ${
                canAfford
                  ? tradeType === 'buy'
                    ? `${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`
                    : `${isDarkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white`
                  : `${isDarkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'} cursor-not-allowed`
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
