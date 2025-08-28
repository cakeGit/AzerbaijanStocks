import React, { useRef, useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatting';
import { useStockHistory } from '../hooks/useApi';

const StockChart = ({ ticker, loading: parentLoading }) => {
  const canvasRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [ohlcData, setOhlcData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('1D');

  const timePeriods = [
    { key: '1H', label: '1H', hours: 1, granularity: 'minute' },
    { key: '1D', label: '1D', days: 1, granularity: 'minute' },
    { key: '1W', label: '1W', days: 7, granularity: 'hour' },
    { key: '1M', label: '1M', days: 30, granularity: 'hour' },
    { key: '3M', label: '3M', days: 90, granularity: 'day' },
    { key: '6M', label: '6M', days: 180, granularity: 'day' },
    { key: '1Y', label: '1Y', days: 365, granularity: 'month' }
  ];

  // Get the selected period data
  const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);

  // Use the API hook with the selected period and granularity
  const { history: data, loading } = useStockHistory(
    ticker,
    selectedPeriod,
    selectedPeriodData?.granularity || 'minute'
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || loading) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Set canvas size
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

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
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Draw candlesticks
    const spacing = chartWidth / newOhlcData.length;
    const candleWidth = Math.max(2, Math.min(20, spacing * 0.8));

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

      // Highlight hovered candle
      if (hoveredBar === index) {
        ctx.strokeStyle = '#1e40af'; // azt-blue
        ctx.lineWidth = 2;
        ctx.strokeRect(x - candleWidth / 2 - 2, bodyTop - 2, candleWidth + 4, bodyHeight + 4);
      }
    });

    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;

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
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    const yLabels = 5;
    for (let i = 0; i <= yLabels; i++) {
      const price = minPrice + (priceRange * i) / yLabels;
      const y = margin.top + chartHeight - (chartHeight * i) / yLabels;
      ctx.fillText(`$${price.toFixed(2)}`, margin.left - 10, y + 4);
    }

    // X-axis labels (show appropriate format based on granularity)
    ctx.textAlign = 'center';
    const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);
    const maxLabels = Math.min(10, newOhlcData.length);
    const step = Math.max(1, Math.floor(newOhlcData.length / maxLabels));

    for (let i = 0; i < newOhlcData.length; i += step) {
      const x = margin.left + i * spacing + spacing / 2;
      const date = new Date(newOhlcData[i].timestamp);

      let timeLabel;
      switch (selectedPeriodData?.granularity) {
        case 'minute':
          timeLabel = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          break;
        case 'hour':
          timeLabel = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit'
          });
          break;
        case 'day':
          timeLabel = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          break;
        case 'month':
          timeLabel = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
          });
          break;
        default:
          timeLabel = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
      }

      ctx.fillText(timeLabel, x, height - margin.bottom + 15);
    }

  }, [data, dimensions, selectedPeriod]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const margin = { left: 60, right: 20 };
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {ticker} Candlestick Chart ({selectedPeriod})
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
              {(() => {
                const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);
                switch (selectedPeriodData?.granularity) {
                  case 'minute': return 'Minute intervals';
                  case 'hour': return 'Hourly intervals';
                  case 'day': return 'Daily intervals';
                  case 'month': return 'Monthly intervals';
                  default: return '';
                }
              })()}
            </span>
          </h3>
          <div className="flex space-x-1">
            {timePeriods.map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-azt-blue text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-96 cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ width: '100%', height: '400px' }}
            />

            {/* Tooltip */}
            {hoveredBar !== null && ohlcData[hoveredBar] && (
              <div className="absolute top-4 left-4 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10">
                <div className="text-sm font-medium mb-1">
                  {(() => {
                    const date = new Date(ohlcData[hoveredBar].timestamp);
                    const selectedPeriodData = timePeriods.find(p => p.key === selectedPeriod);

                    switch (selectedPeriodData?.granularity) {
                      case 'minute':
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      case 'hour':
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit'
                        });
                      case 'day':
                        return date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      case 'month':
                        return date.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        });
                      default:
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                    }
                  })()}
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
};

export default StockChart;
