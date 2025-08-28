import React, { useState, useEffect } from 'react';
import { useStocks } from '../../hooks/useApi';
import { formatCurrency, formatChange, getChangeColor } from '../../utils/formatting';

const EmbedCondensed = ({ previewTheme }) => {
  const { stocks, loading } = useStocks();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [isAnimating, setIsAnimating] = useState(false);

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
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % stocks.length);
          setIsAnimating(false);
        }, 300); // Animation duration
      }, 4000); // Change every 4 seconds

      return () => clearInterval(interval);
    }
  }, [stocks.length]);

  const isLightTheme = theme === 'light';

  if (loading || stocks.length === 0) {
    return (
      <div className={`${isLightTheme ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-700'} rounded-sm border`} style={{ width: '160px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse">
          <div className="text-center">
            <div className="h-6 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentStock = stocks[currentIndex];

  return (
    <a
      href={window.location.origin}
      target="_blank"
      rel="noopener noreferrer"
      className="block cursor-pointer"
    >
      <div
        className={`${isLightTheme ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-700'} overflow-hidden flex items-center justify-center rounded-sm border`}
        style={{ width: '160px', height: '35px' }}
      >
        <div
          className={`text-center transition-all duration-300 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className={`font-bold text-sm ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>
              {currentStock.ticker}
            </span>
            <span className={`text-sm ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>
              {formatCurrency(currentStock.price)}
            </span>
            <span className={`text-sm ${getChangeColor(currentStock.change, !isLightTheme)}`}>
              {formatChange(currentStock.change)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default EmbedCondensed;
