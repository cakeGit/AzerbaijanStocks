import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStocks, useStockHistory, usePortfolio } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import StockChart from '../components/StockChart';
import TradingForm from '../components/TradingForm';
import { formatCurrency, formatChange, formatNumber, getChangeColor } from '../utils/formatting';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const StockDetail = () => {
  const { ticker } = useParams();
  const { stocks, loading: stocksLoading } = useStocks();
  const { portfolio, updatePortfolio } = usePortfolio();
  const { isDarkMode } = useTheme();

  const stock = stocks.find(s => s.ticker === ticker);

  if (stocksLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-xl w-1/4 mb-4"></div>
          <div className="h-4 bg-muted rounded-xl w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground mb-2">Stock Not Found</h2>
        <p className="text-muted-foreground mb-4">The stock ticker "{ticker}" was not found.</p>
        <Link
          to="/"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleTrade = async (action, ticker, shares, price) => {
    return await updatePortfolio(action, ticker, shares, price);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {stock.ticker} - {stock.name}
            </h1>
            {stock.authorUrl && (
              <div className="mt-1">
                <a 
                  href={stock.authorUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors inline-flex items-center gap-1"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  View on CurseForge
                </a>
              </div>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-2xl font-bold text-foreground">
                {formatCurrency(stock.price)}
              </span>
              <span className={`text-lg font-medium ${getChangeColor(stock.change, isDarkMode)}`}>
                {formatChange(stock.change)}
              </span>
              <span className="text-muted-foreground">
                Volume: {formatNumber(stock.volume)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ marginTop: 0 }}>
        {/* Left Column - Chart */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stock Chart */}
          <StockChart 
            ticker={ticker} 
          />

        </div>

        {/* Right Column - Trading Form */}
        <div className="lg:col-span-1">
          <TradingForm 
            stock={stock} 
            onTrade={handleTrade}
            loading={false}
            portfolio={portfolio}
          />
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
