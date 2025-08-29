import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStockHistory } from '../hooks/useApi';

const ParallaxCandlestickChart = () => {
  const containerRef = useRef(null);
  const backgroundCanvasRef = useRef(null);
  const foregroundCanvasRef = useRef(null);
  const tickerCanvasRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [currentScale, setCurrentScale] = useState(1.0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationTime, setAnimationTime] = useState(0);
  const stocks = ['KPT', 'MRH', 'DRA', 'RAY', 'ITH', 'SLI', 'SPO', 'MAR', 'POS', 'FUR', 'ORD', 'LYS', 'KAY', 'RDH', 'A0A', 'TRO', 'LUN', 'TOM', 'NOC', 'RBA', 'DRM', 'OIE', 'QUI', 'ELO', 'EMB'];
  const { history: aztData, loading: aztLoading } = useStockHistory('AZT', '1H', 'minute');
  const { history: backgroundData, loading: backgroundLoading } = useStockHistory('DRA', '1H', 'minute');

  // Debug data loading
  useEffect(() => {
    console.log('AZT Data:', aztData?.length, 'Loading:', aztLoading);
    console.log('Background Data:', backgroundData?.length, 'Loading:', backgroundLoading);
  }, [aztData, backgroundData, aztLoading, backgroundLoading]);

  // Handle mouse movement with throttling
  useEffect(() => {
    let lastMouseUpdate = 0;
    const MOUSE_THROTTLE = 16; // ~60fps for mouse movement
    
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMouseUpdate >= MOUSE_THROTTLE) {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        } else {
          setMousePosition({
            x: e.clientX,
            y: e.clientY
          });
        }
        lastMouseUpdate = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle scroll events to update scale immediately
  useEffect(() => {
    const handleScroll = () => {
      const newScrollY = window.scrollY;
      setScrollY(newScrollY);
      
      // Calculate scale directly from scroll position (no lerp)
      const baseScale = 1.0;
      const scrollScale = 1 + (newScrollY * 0.004);
      const newScale = Math.min(Math.max(scrollScale, 0.5), 3.0);
      setCurrentScale(newScale);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Common render function for both layers
  const renderLayer = (canvasRef, mouseMultiplierX, mouseMultiplierY, opacity, layerData, layerLoading, verticalOffset = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = dimensions.width;
    const height = dimensions.height;

    if (!width || !height) return;

    // Clear the canvas before rendering
    ctx.clearRect(0, 0, width, height);

    // Set canvas size to match container
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Calculate parallax offset
    const mouseOffsetX = ((mousePosition.x - width / 2) / width) * mouseMultiplierX;
    const mouseOffsetY = ((mousePosition.y - height / 2) / height) * mouseMultiplierY;
    
    // Use the smoothly interpolated scale
    const scale = currentScale;

    ctx.save();
    ctx.translate(mouseOffsetX + width / 2, mouseOffsetY + height / 2 + verticalOffset);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    if (layerData.length && !layerLoading) {
      renderCandlesticks(ctx, layerData, width, height, opacity, animationTime);
    }

    // Add dot pattern to background layer
    if (canvasRef === backgroundCanvasRef) {
      renderDotPattern(ctx, width, height, opacity * 0.6, animationTime);
    }

    ctx.restore();
  };

  // Render background layer (DRA data - slower scaling) - throttled
  useEffect(() => {
      renderLayer(backgroundCanvasRef, 60, 40, 0.4, backgroundData, backgroundLoading, -50);
  }, [backgroundData, dimensions, mousePosition, currentScale, backgroundLoading, animationTime]);

  // Render foreground layer (AZT data - faster scaling) - throttled with higher opacity
  useEffect(() => {
      renderLayer(foregroundCanvasRef, 100, 60, 0.9, aztData, aztLoading, 0);
  }, [aztData, dimensions, mousePosition, currentScale, aztLoading, animationTime]);

  // Render ticker canvas - throttled
  useEffect(() => {
      renderTicker(tickerCanvasRef);
  }, [dimensions, animationTime]);

  const renderCandlesticks = (ctx, chartData, width, height, opacity, currentTime) => {
    if (!chartData.length) return;

    ctx.globalAlpha = opacity;

    // Limit data processing to prevent memory issues
    const maxDataPoints = 200; // Limit to prevent memory overload
    const processedData = chartData.slice(-maxDataPoints); // Only use recent data

    // Prepare OHLC data
    const ohlcData = [];
    for (let i = 0; i < processedData.length; i++) {
      const item = processedData[i];

      if (item.open !== undefined && item.high !== undefined && item.low !== undefined && item.close !== undefined) {
        ohlcData.push({
          timestamp: item.timestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        });
      } else {
        const currentPrice = item.price;
        const prevPrice = i > 0 ? processedData[i - 1].price : currentPrice;
        const seed = (currentPrice * 1000 + i) % 1000;
        const volatility = Math.abs(currentPrice * 0.02);

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
    }

    // Early return if no data to prevent unnecessary calculations
    if (ohlcData.length === 0) {
      ctx.globalAlpha = 1;
      return;
    }

    // Calculate price range
    const allPrices = ohlcData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    // Chart dimensions - properly centered and full width
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Draw candlesticks with calculated width distribution
    const minSpacing = 8;
    const maxCandles = Math.floor(chartWidth / minSpacing);
    const candlesToShow = Math.min(ohlcData.length, maxCandles);
    const spacing = chartWidth / Math.max(candlesToShow, 1);
    const candleWidth = Math.max(4, Math.min(12, spacing * 0.4));

    // Use requestIdleCallback for non-critical rendering when available
    const renderCandles = () => {
      ohlcData.forEach((candle, index) => {
        const baseX = margin.left + index * spacing + spacing / 2;
        
        // Add subtle movement animation with reduced calculation
        const animationOffsetX = Math.sin(currentTime * 0.5 + index * 0.3) * 2;
        const animationOffsetY = Math.cos(currentTime * 0.3 + index * 0.5) * 1.5;
        
        const x = baseX + animationOffsetX;

        // Calculate Y positions with animation offset
        const openY = margin.top + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight + animationOffsetY;
        const closeY = margin.top + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight + animationOffsetY;
        const highY = margin.top + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight + animationOffsetY;
        const lowY = margin.top + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight + animationOffsetY;

        // Determine if bullish or bearish
        const isBullish = candle.close > candle.open;
        const bodyColor = isBullish ? '#3ac96f' : '#dc2626';
        const wickColor = '#6b7280';

        // Draw wick (high-low line)
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw body (open-close rectangle)
        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(2, bodyBottom - bodyTop);

        ctx.fillStyle = bodyColor;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

        // Draw body border
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      });
    };

    renderCandles();
    ctx.globalAlpha = 1;
  };

  // Render dot pattern for background parallax
  const renderDotPattern = (ctx, width, height, opacity, currentTime) => {
    ctx.globalAlpha = opacity;

    // Create a grid of dots with some randomness
    const dotSpacing = 80; // Distance between dots
    const dotSize = 2; // Base dot size
    const rows = Math.ceil(height / dotSpacing) + 2; // Extra rows for parallax
    const cols = Math.ceil(width / dotSpacing) + 2; // Extra columns for parallax

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        // Add some randomness to position
        const baseX = col * dotSpacing;
        const baseY = row * dotSpacing;

        // Add subtle animation movement
        const animationOffsetX = Math.sin(currentTime * 0.3 + row * 0.5 + col * 0.3) * 3;
        const animationOffsetY = Math.cos(currentTime * 0.4 + row * 0.3 + col * 0.7) * 2;

        const x = baseX + animationOffsetX;
        const y = baseY + animationOffsetY;

        // Vary dot size slightly for organic feel
        const sizeVariation = Math.sin(currentTime * 0.2 + row * 0.1 + col * 0.1) * 0.5;
        const currentDotSize = dotSize + sizeVariation;

        // Create gradient for each dot
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentDotSize * 2);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // Blue center
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)'); // Blue middle
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)'); // Transparent edge

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, currentDotSize * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  };

  // Continuous animation loop
  useEffect(() => {
    let animationFrameId;
    const animate = () => {
      setAnimationTime(prev => prev + 0.016); // ~60fps increment
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Render ticker canvas
  const renderTicker = (canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = dimensions.width;
    const height = dimensions.height;

    if (!width || !height) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set font properties
    const baseFontSize = Math.min(width * 0.08, height * 0.15); // Responsive font size
    ctx.textAlign = 'center'; // Center align for fixed width
    ctx.textBaseline = 'middle';

    // Calculate vertical center position
    const centerY = height / 2;
    const elementWidth = 400; // Match the initialization and animation values

    //Get the current render time
    const currentTime = Date.now() / 1000;
    const scrollTime = currentTime / 5;
    const scrollSpeed = elementWidth / 5;

    const getTextElement = (index) => {
        return (index % 2 == 0) ? stocks[(Math.floor(index / 2)) % stocks.length] : "AZT";
    }
    
    const getTextElementsAtTime = (time) => {
        var startElementIndex = Math.floor(time);
        var endElementIndex = Math.ceil(time + width / scrollSpeed);

        return Array.from({ length: endElementIndex - startElementIndex }, (_, i) => getTextElement(startElementIndex + i));
    }

    const elements = getTextElementsAtTime(scrollTime);
    const renderOffset = scrollTime * elementWidth % elementWidth;

    for (let i = 0; i < elements.length; i++) {
      const text = elements[i];
      const x = (i * elementWidth) - renderOffset + (elementWidth / 2);

      // Skip rendering if completely off-screen
      if (x + elementWidth / 2 < 0 || x - elementWidth / 2 > width) continue;

      // Calculate distance from center for scaling and opacity
      const distanceFromCenter = Math.abs(x - width / 2);
      const maxDistance = width / 2 + elementWidth;
      const fontSize = baseFontSize;
      const opacity = 1 - Math.min(distanceFromCenter / maxDistance, 1) * 0.8; // Fade out to 20%

      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = text == "AZT" ? `#3ac96f` : `rgba(100, 100, 100, ${opacity})`;
      ctx.fillText(text, x, centerY);
    }

    ctx.globalAlpha = 1.0;
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ height: '100vh', zIndex: 0 }}
    >
      {/* Background layer */}
      <canvas
        ref={backgroundCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Ticker Canvas - behind title text */}
      <canvas
        ref={tickerCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      />

      {/* Foreground layer */}
      <canvas
        ref={foregroundCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 5 }}
      />

      {/* Main Title - positioned over everything */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 6 }}
      >
        <h1 className="text-9xl md:text-[14rem] lg:text-[18rem] font-bold">
          <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-300">
            Stock Exchange
          </span>
        </h1>
      </div>

      {/* Gradient overlay for better text readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" 
        style={{ zIndex: 4 }}
      />

      {/* Fade out gradient at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent" 
        style={{ zIndex: 5 }} 
      />
    </div>
  );
};

export default ParallaxCandlestickChart;
