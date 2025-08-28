import React, { memo, useEffect, useState } from 'react';
import { useStocks } from '../../hooks/useApi';
import { formatCurrency, formatChange, getChangeColor } from '../../utils/formatting';

const TickerItem = memo(({ stock, isLightTheme }) => {
  return (
    <span className="flex items-center space-x-2 whitespace-nowrap text-sm">
      <span className={`font-bold ${isLightTheme ? 'text-blue-600' : 'text-blue-400'}`}>
        {stock.ticker}
      </span>
      <span className={`${isLightTheme ? 'text-gray-900' : 'text-white'} smooth-update`}>
        {formatCurrency(stock.price)}
      </span>
      <span className={`price-update ${getChangeColor(stock.change, !isLightTheme)}`}>
        {formatChange(stock.change)}
      </span>
    </span>
  );
});

const EmbedTicker = memo(({ previewTheme }) => {
  const { stocks, loading } = useStocks();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Use previewTheme if provided (for preview mode), otherwise read from URL
    if (previewTheme) {
      setTheme(previewTheme);
    } else {
      const updateTheme = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');
        if (themeParam === 'light') {
          setTheme('light');
        } else {
          setTheme('dark');
        }
      };

      // Initial theme detection
      updateTheme();

      // Listen for URL changes
      const handlePopState = () => updateTheme();
      window.addEventListener('popstate', handlePopState);

      const handleHashChange = () => updateTheme();
      window.addEventListener('hashchange', handleHashChange);

      // Periodic check for URL parameter changes
      const interval = setInterval(updateTheme, 100);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('hashchange', handleHashChange);
        clearInterval(interval);
      };
    }
  }, [previewTheme]);

  const isLightTheme = theme === 'light';

  if (loading || stocks.length === 0) {
    return (
      <div className={`${isLightTheme ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'} p-2`}>
        <div className="animate-pulse flex items-center space-x-8">
          <span className="text-sm">Loading market data...</span>
        </div>
      </div>
    );
  }

  // Determine overall data source status
  const hasRealData = stocks.some(stock => stock.dataSource === 'statistics');
  const dataSourceText = hasRealData ? 'Live Statistics' : 'Generated Data';

  return (
    <a
      href={window.location.origin}
      target="_blank"
      rel="noopener noreferrer"
      className="block cursor-pointer"
    >
      <div className={`${isLightTheme ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}>
        <div className="animate-ticker flex items-center space-x-8 py-2 px-4">
          {stocks.concat(stocks).map((stock, index) => (
            <TickerItem key={`${stock.ticker}-${index}`} stock={stock} isLightTheme={isLightTheme} />
          ))}
        </div>
      </div>
    </a>
  );
});

export default EmbedTicker;
