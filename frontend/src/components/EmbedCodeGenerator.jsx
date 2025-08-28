import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import EmbedTicker from '../pages/embed/EmbedTicker';
import EmbedSwiper from '../pages/embed/EmbedSwiper';
import EmbedCondensed from '../pages/embed/EmbedCondensed';

const EmbedCodeGenerator = () => {
  const [selectedType, setSelectedType] = useState('ticker');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [copied, setCopied] = useState(false);
  const { isDarkMode } = useTheme();

  const generateEmbedCode = (type, theme) => {
    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}/embed/${type}?theme=${theme}`;

    if (type === 'ticker') {
      return `<iframe
  src="${embedUrl}"
  width="100%"
  height="80"
  frameborder="0"
  scrolling="no"
  style="border: none; overflow: hidden;">
</iframe>`;
    } else if (type === 'swiper') {
      return `<iframe
  src="${embedUrl}"
  width="100%"
  height="440"
  frameborder="0"
  scrolling="auto"
  style="border: none; border-radius: 8px;">
</iframe>`;
    } else if (type === 'condensed') {
      return `<iframe
  src="${embedUrl}"
  width="160"
  height="35"
  frameborder="0"
  scrolling="no"
  style="border: none; overflow: hidden;">
</iframe>`;
    }
    return '';
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode(selectedType, selectedTheme));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Embed Stock Displays
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Display Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent sm:text-sm transition-colors"
            >
              <option value="ticker">Scrolling Ticker Tape</option>
              <option value="swiper">Swiping Stock Cards</option>
              <option value="condensed">Condensed Scrolling Cards</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Theme
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent sm:text-sm transition-colors"
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <label className="block text-sm font-medium mb-2 text-foreground">
            Live Preview
          </label>
          <div className="border-2 border-border rounded-xs overflow-hidden relative bg-muted">
            <div className="absolute top-2 left-2 px-2 py-1 text-xs rounded-xs z-10 bg-muted text-muted-foreground">
              Preview
            </div>
            {selectedType === 'ticker' ? (
              <div className="overflow-hidden">
                <EmbedTicker previewTheme={selectedTheme} />
              </div>
            ) : selectedType === 'condensed' ? (
              <div style={{ height: '35px', overflow: 'hidden' }} className="flex justify-center">
                <div style={{ width: '160px', height: '35px' }}>
                  <EmbedCondensed previewTheme={selectedTheme} />
                </div>
              </div>
            ) : (
              <div className="h-96 overflow-hidden pt-8">
                <EmbedSwiper previewTheme={selectedTheme} />
              </div>
            )}
          </div>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            This is exactly how the embedded display will appear on your website
          </p>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border">
          <label className="block text-sm font-medium mb-2 text-foreground">
            Embed Code
          </label>
          <div className="relative">
            <textarea
              readOnly
              value={generateEmbedCode(selectedType, selectedTheme)}
              className="w-full px-3 py-2 border border-border rounded-xs bg-muted text-foreground font-mono text-sm resize-none"
              rows={6}
            />
            <button
              onClick={copyToClipboard}
              className={`absolute top-2 right-2 px-3 py-1 text-sm rounded-xs transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Instructions:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the embed code above</li>
              <li>Paste it into your website's HTML</li>
              <li>The embedded display will automatically sync with live market data</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeGenerator;