import React, { memo } from 'react';
import { useStocks } from '../hooks/useApi';
import { useActiveTraders } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import StocksTable from '../components/StocksTable';
import DownloadsStatusWidget from '../components/DownloadsStatusWidget';
import TopPerformers from '../components/TopPerformers';

const DashboardCard = memo(({ title, value, colorClass }) => {
  return (
    <div className="rounded-xl shadow-md bg-card border border-border p-3">
      <div className="text-center">
        <h3 className="text-sm font-semibold mb-1 text-foreground">Total Stocks</h3>
        <p className="text-xl font-bold smooth-update text-primary">
          {value}
        </p>
      </div>
    </div>
  );
});

const Dashboard = memo(() => {
  const { stocks, loading, error } = useStocks();
  const { activeTraders, loading: tradersLoading } = useActiveTraders();
  const { isDarkMode } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  if (!isAuthenticated || !userId) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 text-destructive">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p>Please log in to access the dashboard and trade stocks.</p>
        </div>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 text-destructive">
          <h2 className="text-xl font-semibold">Error Loading Data</h2>
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Market Dashboard
        </h1>
        <p className="text-muted-foreground">
          View the state of the create modding market.
        </p>
      </div>

      <TopPerformers />

      <StocksTable stocks={stocks} loading={loading} userId={userId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Total Stocks"
          value={loading ? '...' : stocks.length}
        />

        <div className="rounded-xl shadow-md bg-card border border-border p-3">
          <div className="text-center">
            <h3 className="text-sm font-semibold mb-1 text-foreground">Active Traders</h3>
            <p className="text-xl font-bold smooth-update text-primary">
              {tradersLoading ? '...' : activeTraders.count}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
