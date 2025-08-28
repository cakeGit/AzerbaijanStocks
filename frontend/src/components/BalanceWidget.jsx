import React, { useState, useEffect, memo } from 'react';
import { FaCoins, FaChartLine, FaWallet, FaClock } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { stocksApi } from '../utils/api';

const BalanceWidget = memo(({ pendingTransactions = [] }) => {
  const [userData, setUserData] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState(0);
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [userResponse, stocksResponse] = await Promise.all([
          stocksApi.getUserData(user.id),
          stocksApi.getAllStocks()
        ]);

        const userData = userResponse.data;
        const stocks = stocksResponse.data;

        setUserData(userData);

        // Calculate portfolio value using holdings format
        let totalValue = 0;
        if (userData.holdings && userData.holdings.length > 0) {
          // Use new holdings format
          userData.holdings.forEach(holding => {
            const stock = stocks.find(s => s.ticker === holding.ticker);
            if (stock && holding.shares > 0) {
              totalValue += stock.price * holding.shares;
            }
          });
        } else if (userData.shares) {
          // Fallback to old shares format
          Object.entries(userData.shares).forEach(([ticker, shares]) => {
            const stock = stocks.find(s => s.ticker === ticker);
            if (stock && shares > 0) {
              totalValue += stock.price * shares;
            }
          });
        }
        setPortfolioValue(totalValue);
      } catch (error) {
        console.error('Failed to fetch balance data:', error);
        setUserData(null);
        setPortfolioValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Calculate pending balance changes
  const pendingCashChange = pendingTransactions.reduce((total, transaction) => {
    return total + (transaction.type === 'buy' ? -transaction.total : transaction.total);
  }, 0);

  const pendingBalance = userData ? userData.cash + pendingCashChange : 0;

  const totalWealth = userData ? userData.cash + portfolioValue : 0;
  const hasPositiveChange = pendingCashChange > 0;
  const hasNegativeChange = pendingCashChange < 0;

  const views = userData ? [
    // View 1: Cash Balance
    {
      icon: <FaCoins className="text-yellow-500" />,
      label: 'Cash',
      value: `$${userData.cash.toFixed(2)}`,
      subValue: pendingCashChange !== 0 ? `${hasPositiveChange ? '+' : ''}$${pendingCashChange.toFixed(2)}` : null,
      color: 'text-green-600'
    },
    // View 2: Portfolio Value
    {
      icon: <FaChartLine className="text-accent-foreground" />,
      label: 'Stocks',
      value: `$${portfolioValue.toFixed(2)}`,
      subValue: null,
      color: 'text-accent-foreground'
    },
    // View 3: Total Wealth
    {
      icon: <span className="text-purple-500 text-lg">🤑</span>,
      label: 'Total',
      value: `$${totalWealth.toFixed(2)}`,
      subValue: pendingCashChange !== 0 ? `→ $${(totalWealth + pendingCashChange).toFixed(2)}` : null,
      color: 'text-foreground'
    },
    // View 4: Pending Transactions (only if there are any)
    ...(pendingTransactions.length > 0 ? [{
      icon: <FaClock className="text-orange-500" />,
      label: 'Pending',
      value: `${pendingTransactions.length} transaction${pendingTransactions.length > 1 ? 's' : ''}`,
      subValue: null,
      color: 'text-orange-600'
    }] : [])
  ] : [];

  // Cycle through different views
  useEffect(() => {
    if (views.length === 0) return;

    const viewInterval = setInterval(() => {
      setCurrentView((prev) => (prev + 1) % views.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(viewInterval);
  }, [views.length]);

  const currentViewData = views[currentView % views.length];

  if (loading) {
    return (
      <div className="rounded-xs border border-border shadow-sm w-44 bg-card p-4">
        <div className="animate-pulse h-8 flex items-center">
          <div className="h-3 rounded-xs w-12 bg-muted"></div>
          <div className="ml-auto h-4 rounded-xs w-16 bg-muted"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xs border border-muted/20 shadow-sm w-44 bg-muted/10 p-4">
        <div className="text-xs h-8 flex items-center text-muted-foreground">
          Please log in to view balance
        </div>
      </div>
    );
  }

  if (!userData && !loading) {
    return (
      <div className="rounded-xs border border-destructive/20 shadow-sm w-44 bg-destructive/10 p-4">
        <div className="text-xs h-8 flex items-center text-destructive">
          Unable to load balance data
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xs border border-border shadow-sm w-44 overflow-hidden relative bg-card p-4">
      <div className="relative h-8">
        {views.map((view, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-between transition-all duration-700 ease-in-out ${
              index === currentView
                ? 'opacity-100 transform translate-x-0'
                : index === (currentView - 1 + views.length) % views.length
                ? 'opacity-0 transform -translate-x-full'
                : index === (currentView + 1) % views.length
                ? 'opacity-0 transform translate-x-full'
                : 'opacity-0 transform translate-x-full'
            }`}
          >
            <div className="flex items-center text-xs text-muted-foreground">
              {view.icon}
              <span className="ml-2">{view.label}</span>
            </div>
            <div className="text-right">
              <div className={`font-bold text-sm smooth-update ${view.color}`}>
                {view.value}
              </div>
              {view.subValue && (
                <div className="text-xs smooth-update text-muted-foreground">
                  {view.subValue}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default BalanceWidget;
