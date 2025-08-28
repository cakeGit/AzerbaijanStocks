import React, { useState, useEffect } from 'react';

const DownloadsStatusWidget = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    if (!status) return 'text-muted-foreground';

    const { systemStatus, externalApi } = status;

    if (systemStatus.isUsingRealStats && externalApi.status === 'available') {
      return 'text-green-600';
    } else if (systemStatus.isGeneratingData) {
      return 'text-yellow-600';
    } else {
      return 'text-destructive';
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
    <div className="bg-card rounded-xs shadow-sm border border-border p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Data Status
        </h3>
        <p className={`text-lg font-medium smooth-update ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        {!loading && !error && status && (
          <div className="text-sm mt-2 text-muted-foreground">
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
          <div className="text-sm mt-2 text-destructive">
            Failed to load
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsStatusWidget;
