import React, { useState, useEffect, memo, useRef } from 'react';
import { useStocks, useStockHistory } from '../hooks/useApi';
import { stocksApi } from '../utils/api';
import { formatCurrency, formatChange, getChangeColor } from '../utils/formatting';
import { useTheme } from '../contexts/ThemeContext';
import StockChart from './StockChart';

const CompactStockChart = memo(({ ticker, isHovered = false, onHover, onLeave }) => {
  const canvasRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [ohlcData, setOhlcData] = useState([]);

  // Use the API hook with fixed 1D period and hour granularity
  const { history: data, loading } = useStockHistory(ticker, '1D', 'hour');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || loading) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Set canvas size with higher resolution for better quality
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scaleFactor = devicePixelRatio * 2; // Double the resolution for crisp rendering

    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);

    // Clear canvas with proper scaling
    ctx.clearRect(0, 0, width, height);

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Use server-aggregated data directly
    const chartData = data;

    // Prepare OHLC data from server-aggregated data
    const newOhlcData = [];
    for (let i = 0; i < chartData.length; i++) {
      const item = chartData[i];

      // Use aggregated OHLC data if available, otherwise generate from price
      if (item.open !== undefined && item.high !== undefined && item.low !== undefined && item.close !== undefined) {
        newOhlcData.push({
          timestamp: item.timestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        });
      } else {
        // Fallback for minute data - generate OHLC from single price point
        const currentPrice = item.price;
        const prevPrice = i > 0 ? chartData[i - 1].price : currentPrice;

        // Use deterministic values based on price and index for consistent OHLC generation
        const seed = (currentPrice * 1000 + i) % 1000;
        const volatility = Math.abs(currentPrice * 0.02);

        const high = currentPrice + ((seed / 1000) * volatility);
        const low = currentPrice - (((999 - seed) / 1000) * volatility);
        const open = prevPrice + (((seed % 100) / 100 - 0.5) * volatility * 0.5);
        const close = currentPrice;

        newOhlcData.push({
          timestamp: item.timestamp,
          open: Math.max(open, low),
          high: Math.max(high, open, close),
          low: Math.min(low, open, close),
          close: close
        });
      }
    }

    setOhlcData(newOhlcData);

    // Calculate price range
    const allPrices = newOhlcData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    // Chart dimensions
    const margin = { top: 10, right: 10, bottom: 20, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Draw candlesticks
    const spacing = chartWidth / newOhlcData.length;
    const candleWidth = Math.max(1, Math.min(12, spacing * 0.8));

    newOhlcData.forEach((candle, index) => {
      const x = margin.left + index * spacing + spacing / 2;

      // Calculate Y positions
      const openY = margin.top + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = margin.top + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = margin.top + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = margin.top + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      // Determine if bullish (close > open) or bearish
      const isBullish = candle.close > candle.open;
      const bodyColor = isBullish ? '#16a34a' : '#dc2626'; // azt-green or azt-red
      const wickColor = '#6b7280'; // gray-500

      // Draw wick (high-low line)
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body (open-close rectangle)
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Draw body border
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Highlight hovered candle
      if (hoveredBar === index) {
        ctx.strokeStyle = '#1e40af'; // azt-blue
        ctx.lineWidth = 2;
        ctx.strokeRect(x - candleWidth / 2 - 2, bodyTop - 2, candleWidth + 4, bodyHeight + 4);
      }
    });

    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    const yLabels = 3;
    for (let i = 0; i <= yLabels; i++) {
      const price = minPrice + (priceRange * i) / yLabels;
      const y = margin.top + chartHeight - (chartHeight * i) / yLabels;
      ctx.fillText(`$${price.toFixed(1)}`, margin.left - 8, y + 3);
    }

    // X-axis labels (show time)
    ctx.textAlign = 'center';
    const maxLabels = Math.min(6, newOhlcData.length);
    const step = Math.max(1, Math.floor(newOhlcData.length / maxLabels));

    for (let i = 0; i < newOhlcData.length; i += step) {
      const x = margin.left + i * spacing + spacing / 2;
      const date = new Date(newOhlcData[i].timestamp);
      const timeLabel = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      ctx.fillText(timeLabel, x, height - margin.bottom + 12);
    }

  }, [data, dimensions, loading, hoveredBar]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const margin = { left: 40, right: 10 };
    const chartWidth = rect.width - margin.left - margin.right;
    const spacing = chartWidth / data.length;

    const candleIndex = Math.floor((x - margin.left) / spacing);
    if (candleIndex >= 0 && candleIndex < data.length) {
      setHoveredBar(candleIndex);
    } else {
      setHoveredBar(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div
      className={`bg-card rounded-lg border border-border transition-all duration-300 cursor-pointer ${
        isHovered ? 'scale-105 shadow-lg z-10' : 'hover:scale-102'
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="p-3">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-44 bg-muted rounded"></div>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair"
              style={{
                height: '180px',
                imageRendering: 'auto',
                imageRendering: '-webkit-optimize-contrast',
                imageRendering: 'crisp-edges'
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Tooltip */}
            {hoveredBar !== null && ohlcData[hoveredBar] && (
              <div className="absolute top-2 left-2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-lg border border-border pointer-events-none z-10">
                <div className="text-xs font-medium mb-1">
                  {new Date(ohlcData[hoveredBar].timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-xs space-y-1">
                  <div>O: {formatCurrency(ohlcData[hoveredBar].open)}</div>
                  <div>H: {formatCurrency(ohlcData[hoveredBar].high)}</div>
                  <div>L: {formatCurrency(ohlcData[hoveredBar].low)}</div>
                  <div>C: {formatCurrency(ohlcData[hoveredBar].close)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

const MiniCandlestickChart = memo(({ ticker }) => {
  const canvasRef = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await stocksApi.getStockHistory(ticker, '1D', 'hour');
        const historyData = response.data.data || response.data;
        setData(historyData);
      } catch (error) {
        console.error(`Error fetching history for ${ticker}:`, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchHistory();
    }
  }, [ticker]);

  useEffect(() => {
    if (!canvasRef.current || !data.length || loading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 120;
    const height = 60;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    // Get last 24 hours of data
    const recentData = data.slice(-12); // Last 12 hours for mini chart
    if (recentData.length === 0) return;

    // Prepare OHLC data
    const ohlcData = [];
    for (let i = 0; i < recentData.length; i++) {
      const item = recentData[i];
      const currentPrice = item.price;
      const prevPrice = i > 0 ? recentData[i - 1].price : currentPrice;

      // Generate OHLC from single price point
      const volatility = Math.abs(currentPrice * 0.02);
      const seed = (currentPrice * 1000 + i) % 1000;

      const high = currentPrice + ((seed / 1000) * volatility);
      const low = currentPrice - (((999 - seed) / 1000) * volatility);
      const open = prevPrice + (((seed % 100) / 100 - 0.5) * volatility * 0.5);
      const close = currentPrice;

      ohlcData.push({
        timestamp: item.timestamp,
        open: Math.max(open, low),
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close: close
      });
    }

    // Calculate price range
    const allPrices = ohlcData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    // Chart dimensions
    const margin = { top: 5, right: 5, bottom: 5, left: 5 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Draw candlesticks
    const spacing = chartWidth / ohlcData.length;
    const candleWidth = Math.max(1, Math.min(8, spacing * 0.8));

    ohlcData.forEach((candle, index) => {
      const x = margin.left + index * spacing + spacing / 2;

      // Calculate Y positions
      const openY = margin.top + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = margin.top + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = margin.top + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = margin.top + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      // Determine if bullish (close > open) or bearish
      const isBullish = candle.close > candle.open;
      const bodyColor = isBullish ? '#16a34a' : '#dc2626';
      const wickColor = '#6b7280';

      // Draw wick (high-low line)
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body (open-close rectangle)
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Draw body border
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

  }, [data, loading]);

  if (loading) {
    return (
      <div className="w-full h-20 bg-muted rounded animate-pulse"></div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-20"
      style={{ width: '100%', height: '80px' }}
    />
  );
});

const TopPerformers = memo(() => {
  const { stocks, loading: stocksLoading } = useStocks();
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const calculateTopPerformers = async () => {
      if (!stocks.length) return;

      setLoading(true);
      const performers = [];

      // Calculate 24h change for each stock
      for (const stock of stocks) {
        try {
          // Get 24h history
          const response = await stocksApi.getStockHistory(stock.ticker, '1D', 'hour');
          const historyData = response.data.data || response.data;

          if (historyData && historyData.length >= 2) {
            const recentData = historyData;
            const currentPrice = recentData[recentData.length - 1].price;
            const dayAgoPrice = recentData[0].price;

            const change24h = ((currentPrice - dayAgoPrice) / dayAgoPrice) * 100;

            performers.push({
              ...stock,
              change24h: parseFloat(change24h.toFixed(2))
            });
          } else {
            // Fallback to current change if no history
            performers.push({
              ...stock,
              change24h: stock.change || 0
            });
          }
        } catch (error) {
          console.error(`Error fetching history for ${stock.ticker}:`, error);
          performers.push({
            ...stock,
            change24h: stock.change || 0
          });
        }
      }

      // Sort by 24h change descending and take top 5
      const sorted = performers
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, 5);

      setTopPerformers(sorted);
      setLoading(false);
    };

    calculateTopPerformers();
  }, [stocks]);

  // Auto-slide every 5 seconds, but pause when hovering
  useEffect(() => {
    if (topPerformers.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % topPerformers.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [topPerformers.length, isPaused]);

  const handleMouseEnter = (index) => {
    if (index === currentIndex) {
      // Only pause auto-sliding when hovering over the current card
      setHoveredIndex(index);
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    // Resume auto-sliding after a short delay
    setTimeout(() => setIsPaused(false), 1000);
  };

  const handleCardClick = (index) => {
    if (index !== currentIndex) {
      // Only allow switching when clicking on non-current cards
      setCurrentIndex(index);
    }
  };

  if (loading || stocksLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8">
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Top Performers (24h)</h2>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg p-4">
                <div className="h-44 bg-muted-foreground/20 rounded mb-3"></div>
                <div className="h-5 bg-muted-foreground/20 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topPerformers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8">
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Top Performers (24h)</h2>
        <p className="text-muted-foreground">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Top Performers (24h)</h2>

      {/* Deck of cards layout */}
      <div className="relative flex justify-center items-end h-[450px] mb-8 overflow-hidden">
        {topPerformers.map((stock, index) => {
          const isCenter = index === currentIndex; // Current index card is the most prominent
          const offset = index - currentIndex; // Calculate offset from current center
          const absOffset = Math.abs(offset);

          // Calculate positioning and sizing
          const baseX = offset * 400; // Increased spacing for larger cards
          const elevation = isCenter ? 50 : Math.max(0, 25 - absOffset * 8); // Increased elevation
          const scale = isCenter ? 1.4 : Math.max(0.85, 1 - absOffset * 0.1); // Larger scales
          const zIndexValue = isCenter ? 50 : Math.max(10, 40 - absOffset * 5);
          const opacity = isCenter ? 1 : Math.max(0.4, 0.8 - absOffset * 0.15); // All cards have transparency based on distance

          return (
            <div
              key={stock.ticker}
              className={`absolute transition-all duration-700 ease-out ${
                index === currentIndex ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{
                transform: `translateX(${baseX}px) translateY(-${elevation}px) scale(${scale})`,
                transformOrigin: 'center bottom',
                zIndex: zIndexValue,
                opacity: opacity
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleCardClick(index)}
            >
              {/* Card shadow/elevation effect */}
              <div
                className="absolute inset-0 bg-black/10 rounded-lg blur-sm"
                style={{
                  transform: 'translateY(4px) scale(0.95)',
                  opacity: (elevation / 50) * opacity
                }}
              />

              {/* Main card */}
              <div className={`relative rounded-lg shadow-sm backdrop-blur-sm ${
                isCenter 
                  ? 'bg-muted/50 border border-border' 
                  : 'bg-muted/50 border border-border/50'
              }`}>
                {/* Stock info */}
                <div className="px-4 py-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`font-bold ${isCenter ? 'text-foreground' : 'text-muted-foreground'} ${isCenter ? 'text-xl' : 'text-base'}`}>
                        {stock.ticker}
                      </div>
                      <div className={`text-xs ${isCenter ? 'text-muted-foreground' : 'text-muted-foreground/70'} ${isCenter ? 'text-sm' : ''} ${isCenter ? '' : 'opacity-80'}`}>
                        {stock.name}
                      </div>
                    </div>
                    <div className={`text-xs ${getChangeColor(stock.change24h, isDarkMode)} ${isCenter ? 'text-sm' : ''} ${isCenter ? '' : 'opacity-80'}`}>
                      {formatChange(stock.change24h)}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="px-3 pb-3">
                  <CompactStockChart
                    ticker={stock.ticker}
                    isHovered={hoveredIndex === index}
                    onHover={index === currentIndex ? () => handleMouseEnter(index) : undefined}
                    onLeave={index === currentIndex ? handleMouseLeave : undefined}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current selection indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {topPerformers.map((stock, index) => (
          <div
            key={index}
            className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
              index === currentIndex
                ? 'bg-accent text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            {stock.ticker}
          </div>
        ))}
      </div>
    </div>
  );
});

export default TopPerformers;
