import React, { useState, useEffect, memo } from 'react';
import { useStocks } from '../../hooks/useApi';
import { formatCurrency, formatChange, getChangeColor } from '../../utils/formatting';

const StockCard = memo(({ stock, isLightTheme }) => {
  return (
    <div className="max-w-sm w-full">
      <div className={`${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'} rounded-lg p-6 shadow-lg transition-all duration-500`}>
        <div className="text-center">
          <h3 className={`text-2xl font-bold mb-2 ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>
            {stock.ticker}
          </h3>
          <p className={`text-sm mb-4 ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
            {stock.name}
          </p>

          <div className="mb-4">
            <div className={`text-3xl font-bold mb-1 smooth-update ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>
              {formatCurrency(stock.price)}
            </div>
            <div className={`text-lg font-semibold price-update ${getChangeColor(stock.change, !isLightTheme)}`}>
              {formatChange(stock.change)}
            </div>
          </div>

          <div className={`text-sm ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`}>
            <p>Volume: {stock.volume?.toLocaleString() || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {/* Dots will be handled by parent component */}
      </div>
    </div>
  );
});

const EmbedSwiper = memo(({ previewTheme }) => {
  const { stocks, loading } = useStocks();
  const [currentIndex, setCurrentIndex] = useState(0);
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

  useEffect(() => {
    if (stocks.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % stocks.length);
      }, 3000); // Change card every 3 seconds

      return () => clearInterval(interval);
    }
  }, [stocks.length]);

  const isLightTheme = theme === 'light';

  if (loading || stocks.length === 0) {
    return (
      <div className={`${isLightTheme ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'} p-6 min-h-[400px] flex items-center justify-center`}>
        <div className="animate-pulse">
          <div className="text-center">
            <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-24 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentStock = stocks[currentIndex];
  const hasRealData = stocks.some(stock => stock.dataSource === 'statistics');
  const dataSourceText = hasRealData ? 'Live Statistics' : 'Generated Data';

  return (
    <a
      href={window.location.origin}
      target="_blank"
      rel="noopener noreferrer"
      className="block cursor-pointer"
    >
      <div className={`${isLightTheme ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'} min-h-[400px] flex flex-col`}>
        <div className="p-6 flex-1 flex items-center justify-center">
          <StockCard stock={currentStock} isLightTheme={isLightTheme} />
        </div>
      </div>
    </a>
  );
});

export default EmbedSwiper;
