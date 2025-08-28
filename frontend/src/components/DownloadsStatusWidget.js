import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const DownloadsStatusWidget = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/downloads/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching downloads status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!status) return isDarkMode ? 'text-gray-400' : 'text-gray-600';

    const { systemStatus, externalApi } = status;

    if (systemStatus.isUsingRealStats && externalApi.status === 'available') {
      return isDarkMode ? 'text-green-400' : 'text-green-600';
    } else if (systemStatus.isGeneratingData) {
      return isDarkMode ? 'text-yellow-400' : 'text-yellow-800';
    } else {
      return isDarkMode ? 'text-red-400' : 'text-red-600';
    }
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (error) return 'Error';
    if (!status) return 'Unknown';

    const { systemStatus, externalApi } = status;

    if (systemStatus.isUsingRealStats && externalApi.status === 'available') {
      return 'Live Stats';
    } else if (systemStatus.isGeneratingData) {
      return 'Generating';
    } else {
      return 'Offline';
    }
  };

  const getStatusDetails = () => {
    if (!status) return '';

    const { stocks, externalApi } = status;
    const realDataPercent = stocks.total > 0 ?
      Math.round((stocks.withRealData / stocks.total) * 100) : 0;

    return `${stocks.withRealData}/${stocks.total} stocks (${realDataPercent}%)`;
  };

  return (
    <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Data Status
        </h3>
        <p className={`text-lg font-medium smooth-update ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        {!loading && !error && status && (
          <div className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div>{getStatusDetails()}</div>
            <div className="mt-1">
              API: {status.externalApi.status}
              {status.externalApi.lastFetch && (
                <span className="ml-1 text-xs">
                  ({new Date(status.externalApi.lastFetch).toLocaleTimeString()})
                </span>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className={`text-sm mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Failed to load
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsStatusWidget;
