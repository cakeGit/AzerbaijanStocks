import React, { memo } from 'react';
import { useStocks } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import StocksTable from '../components/StocksTable';
import DownloadsStatusWidget from '../components/DownloadsStatusWidget';

const DashboardCard = memo(({ title, value, colorClass }) => {
  return (
    <div className={`rounded-lg shadow p-6 ${colorClass}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Total Stocks</h3>
        <p className="text-3xl font-bold smooth-update">
          {value}
        </p>
      </div>
    </div>
  );
});

const Dashboard = memo(() => {
  const { stocks, loading, error } = useStocks();
  const { isDarkMode } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  if (!isAuthenticated || !userId) {
    return (
      <div className="text-center py-12">
        <div className={`mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p>Please log in to access the dashboard and trade stocks.</p>
        </div>
        <button
          onClick={() => window.location.href = '/login'}
          className={`px-4 py-2 rounded-md hover:opacity-90 transition-opacity ${
            isDarkMode ? 'bg-azt-blue-dark text-white' : 'bg-azt-blue text-white'
          }`}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className={`mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          <h2 className="text-xl font-semibold">Error Loading Data</h2>
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className={`px-4 py-2 rounded-md hover:opacity-90 transition-opacity ${
            isDarkMode ? 'bg-azt-blue-dark text-white' : 'bg-azt-blue text-white'
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Market Dashboard
        </h1>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
          Welcome to the AZT Stock Exchange. Track and trade stocks of top Minecraft mod authors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Total Stocks"
          value={loading ? '...' : stocks.length}
          colorClass={isDarkMode ? 'bg-gray-800' : 'bg-white'}
        />

        <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-center">
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Active Traders</h3>
            <p className={`text-3xl font-bold smooth-update ${isDarkMode ? 'text-azt-blue-dark' : 'text-azt-blue'}`}>
              {loading ? '...' : '2'}
            </p>
          </div>
        </div>
      </div>

      <StocksTable stocks={stocks} loading={loading} userId={userId} />
    </div>
  );
});

export default Dashboard;
