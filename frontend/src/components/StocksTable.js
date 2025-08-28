import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatChange, formatNumber, getChangeColor } from '../utils/formatting';
import QuickTradeModal from './QuickTradeModal';

const StockRow = memo(({ stock, isDarkMode, onQuickTrade }) => {
  const [price, setPrice] = useState(stock.price);
  const [change, setChange] = useState(stock.change);

  // Update price and change with smooth transition
  React.useEffect(() => {
    if (stock.price !== price) {
      setPrice(stock.price);
    }
    if (stock.change !== change) {
      setChange(stock.change);
    }
  }, [stock.price, stock.change, price, change]);

  return (
    <tr className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.ticker}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.name}</div>
        {stock.authorUrl && (
          <div className="text-xs">
            <a
              href={stock.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isDarkMode ? 'text-azt-blue-dark hover:text-blue-300' : 'text-azt-blue hover:text-blue-800'}`}
            >
              CurseForge Profile
            </a>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className={`text-sm font-medium smooth-update ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {formatCurrency(price)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className={`text-sm font-medium price-update ${getChangeColor(change, isDarkMode)}`}>
          {formatChange(change)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className={`text-sm smooth-update ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {formatNumber(stock.volume)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => onQuickTrade(stock)}
            className={`px-3 py-1 rounded text-sm hover:opacity-90 transition-opacity ${
              isDarkMode ? 'bg-azt-blue-dark text-white' : 'bg-azt-blue text-white'
            }`}
          >
            Trade
          </button>
          <Link
            to={`/stock/${stock.ticker}`}
            className={`text-sm font-medium px-3 py-1 border rounded hover:opacity-90 transition-opacity ${
              isDarkMode
                ? 'text-azt-blue-dark border-azt-blue-dark hover:bg-gray-700'
                : 'text-azt-blue border-azt-blue hover:bg-blue-50'
            }`}
          >
            Details
          </Link>
        </div>
      </td>
    </tr>
  );
});

const StocksTable = ({ stocks, loading, userId }) => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const { isDarkMode } = useTheme();

  const handleQuickTrade = (stock) => {
    setSelectedStock(stock);
    setTradeModalOpen(true);
  };

  const closeTradeModal = () => {
    setSelectedStock(null);
    setTradeModalOpen(false);
  };

  if (loading) {
    return (
      <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className={`h-4 rounded w-1/4 mb-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-4 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Market Overview</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Symbol
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Company
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Price
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Change
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Volume
                </th>
                <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {stocks.map((stock) => (
                <StockRow
                  key={stock.ticker}
                  stock={stock}
                  isDarkMode={isDarkMode}
                  onQuickTrade={handleQuickTrade}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Trade Modal */}
      {tradeModalOpen && selectedStock && (
        <QuickTradeModal
          stock={selectedStock}
          userId={userId}
          isOpen={tradeModalOpen}
          onClose={closeTradeModal}
        />
      )}
    </>
  );
};

export default StocksTable;
