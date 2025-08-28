import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatChange, formatNumber, getChangeColor } from '../utils/formatting';
import QuickTradeModal from './QuickTradeModal';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { usePortfolio } from '../hooks/useApi';

const StockRow = memo(({ stock, isDarkMode, onQuickTrade, ownedShares }) => {
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
    <tr className="hover:bg-accent/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-foreground">{stock.ticker}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
        <div className="text-sm text-foreground">{stock.name}</div>
        {stock.authorUrl && (
          <div className="text-xs">
            <a
              href={stock.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              CurseForge Profile
            </a>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm font-medium smooth-update text-foreground">
          {formatCurrency(price)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className={`text-sm font-medium price-update ${getChangeColor(change, isDarkMode)}`}>
          {formatChange(change)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm smooth-update text-foreground">
          {formatNumber(stock.volume)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className={`text-sm ${ownedShares > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          {ownedShares > 0 ? formatNumber(ownedShares) : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => onQuickTrade(stock)}
            className="px-3 py-1 rounded-xl text-sm bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all shadow-sm"
          >
            Trade
          </button>
          <Link
            to={`/stock/${stock.ticker}`}
            className="text-sm font-medium px-3 py-1 border border-border rounded-xl bg-card text-primary hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
          >
            Open
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
  const { portfolio } = usePortfolio();

  const handleQuickTrade = (stock) => {
    setSelectedStock(stock);
    setTradeModalOpen(true);
  };

  const closeTradeModal = () => {
    setSelectedStock(null);
    setTradeModalOpen(false);
  };

  // Create a map of ticker -> owned shares
  const ownedSharesMap = React.useMemo(() => {
    const map = new Map();
    if (portfolio?.holdings) {
      portfolio.holdings.forEach(holding => {
        map.set(holding.ticker, holding.shares);
      });
    }
    return map;
  }, [portfolio]);

  if (loading) {
    return (
      <div className="rounded-xl shadow-md bg-card border border-border">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 rounded-xl w-1/4 mb-4 bg-muted"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-4 rounded-xl bg-muted"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl shadow-md overflow-hidden bg-card border border-border">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold text-foreground">Market Overview</h2>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground min-w-[200px]">
                  Company
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Volume
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  You Own
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {stocks.map((stock) => (
                <StockRow
                  key={stock.ticker}
                  stock={stock}
                  isDarkMode={isDarkMode}
                  onQuickTrade={handleQuickTrade}
                  ownedShares={ownedSharesMap.get(stock.ticker) || 0}
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
