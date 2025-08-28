import React, { useState } from 'react';
import { usePortfolio, useStocks, usePortfolioHistory } from '../hooks/useApi';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const Portfolio = () => {
  const { user } = useAuth();
  const { portfolio, loading, error } = usePortfolio();
  const { stocks } = useStocks();
  const [selectedPeriod, setSelectedPeriod] = useState('1D');

  const timePeriods = [
    { key: '1H', label: '1H', hours: 1, granularity: 'minute' },
    { key: '1D', label: '1D', days: 1, granularity: 'minute' },
    { key: '1W', label: '1W', days: 7, granularity: 'hour' },
    { key: '1M', label: '1M', days: 30, granularity: 'hour' },
    { key: '3M', label: '3M', days: 90, granularity: 'day' },
    { key: '6M', label: '6M', days: 180, granularity: 'day' },
    { key: '1Y', label: '1Y', days: 365, granularity: 'month' }
  ];

  // Get the selected period data
  const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);

  // Use the portfolio history hook
  const { history: portfolioHistory, loading: historyLoading } = usePortfolioHistory(
    user?.id,
    selectedPeriod,
    selectedPeriodData?.granularity || 'minute'
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-xs w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-xs shadow-sm p-6 border border-border">
                <div className="h-4 bg-muted rounded-xs mb-2"></div>
                <div className="h-8 bg-muted rounded-xs"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          <h2 className="text-xl font-semibold">Error Loading Portfolio</h2>
          <p>{error || 'Portfolio not found'}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xs hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate portfolio values
  const holdingsValue = portfolio.holdings.reduce((total, holding) => {
    const stock = stocks.find(s => s.ticker === holding.ticker);
    const currentPrice = stock ? stock.price : 0;
    return total + (holding.shares * currentPrice);
  }, 0);

  const totalValue = portfolio.cash + holdingsValue;
  const totalGainLoss = totalValue - 1000; // Assuming starting balance of 1000

  // Prepare portfolio performance data from API
  const performanceData = portfolioHistory.map(item => ({
    date: item.timestamp,
    value: item.value,
    cash: item.cash,
    holdingsValue: item.holdingsValue
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Portfolio - {portfolio.username}
        </h1>
        <p className="text-muted-foreground">
          Track your investments and performance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xs shadow-sm p-6 border border-border">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xs shadow-sm p-6 border border-border">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Cash</h3>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(portfolio.cash)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xs shadow-sm p-6 border border-border">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Holdings Value</h3>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(holdingsValue)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xs shadow-sm p-6 border border-border">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Total P&L</h3>
            <p className={`text-2xl font-bold ${
              totalGainLoss >= 0 ? 'text-green-600' : 'text-destructive'
            }`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="bg-card rounded-xs shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Current Portfolio Performance ({selectedPeriod})
              </h3>
              <Tippy content="Price history of your currently owned stocks">
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </Tippy>
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {(() => {
                  const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);
                  switch (selectedPeriodData?.granularity) {
                    case 'minute': return 'Minute intervals';
                    case 'hour': return 'Hourly intervals';
                    case 'day': return 'Daily intervals';
                    case 'month': return 'Monthly intervals';
                    default: return '';
                  }
                })()}
              </span>
            </div>
            <div className="flex space-x-1">
              {timePeriods.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-3 py-1 text-sm font-medium rounded-xs transition-colors ${
                    selectedPeriod === period.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          {historyLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded-xs w-1/4 mb-4"></div>
              <div className="h-64 bg-muted rounded-xs"></div>
            </div>
          ) : performanceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No historical data available for this period.</p>
              <p className="text-sm mt-2">Try selecting a different time period or check back later.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);

                    switch (selectedPeriodData?.granularity) {
                      case 'minute':
                        return date.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                      case 'hour':
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit'
                        });
                      case 'day':
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        });
                      case 'month':
                        return date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short'
                        });
                      default:
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        });
                    }
                  }}
                />
                <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'value') return [formatCurrency(value), 'Portfolio Value'];
                    if (name === 'cash') return [formatCurrency(value), 'Cash'];
                    if (name === 'holdingsValue') return [formatCurrency(value), 'Holdings Value'];
                    return [value, name];
                  }}
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);

                    switch (selectedPeriodData?.granularity) {
                      case 'minute':
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      case 'hour':
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit'
                        });
                      case 'day':
                        return date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      case 'month':
                        return date.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        });
                      default:
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                    }
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Portfolio Value"
                />
                <Line
                  type="monotone"
                  dataKey="cash"
                  stroke="#6b7280"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                  name="Cash"
                />
                <Line
                  type="monotone"
                  dataKey="holdingsValue"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                  name="Holdings Value"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-card rounded-xs shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Current Holdings
          </h3>
        </div>
        
        {portfolio.holdings.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>No holdings yet. Start trading to build your portfolio!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Market Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {portfolio.holdings.map((holding) => {
                  const stock = stocks.find(s => s.ticker === holding.ticker);
                  const currentPrice = stock ? stock.price : 0;
                  const marketValue = holding.shares * currentPrice;
                  
                  return (
                    <tr key={holding.ticker} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {holding.ticker}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stock ? stock.name : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-foreground">
                          {formatNumber(holding.shares)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-foreground">
                          {formatCurrency(currentPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-foreground">
                          {formatCurrency(marketValue)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
