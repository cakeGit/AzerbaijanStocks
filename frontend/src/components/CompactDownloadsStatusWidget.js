import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional
const CompactDownloadsStatusWidget = () => {
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

    // Refresh status every 60 seconds (less frequent for compact widget)
    const interval = setInterval(fetchStatus, 60000);
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

  const getStatusIcon = () => {
    if (loading) return '⟳';
    if (error) return '⚠';
    if (!status) return '?';

    const { systemStatus, externalApi } = status;

    if (systemStatus.isUsingRealStats && externalApi.status === 'available') {
      return '🟢';
    } else if (systemStatus.isGeneratingData) {
      return '🟡';
    } else {
      return '🔴';
    }
  };

  const getStatusText = () => {
    if (loading) return 'Loading';
    if (error) return 'Error';
    if (!status) return 'Unknown';

    const { systemStatus, stocks } = status;

    if (systemStatus.isUsingRealStats) {
      return `Live: ${stocks.withRealData}/${stocks.total}`;
    } else if (systemStatus.isGeneratingData) {
      return `Sim: ${stocks.withGeneratedData}/${stocks.total}`;
    } else {
      return 'Offline';
    }
  };

  return (
    <Tippy content="Using CurseForge download data from CreateRanked">
        <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
        >
            <span className="text-sm">{getStatusIcon()}</span>
            <span className={getStatusColor()}>
                {getStatusText()}
            </span>
        </div>
    </Tippy>
  );
};

export default CompactDownloadsStatusWidget;
