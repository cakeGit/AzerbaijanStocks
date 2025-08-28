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
    <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Embed Stock Displays
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Display Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-azt-blue ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-azt-blue-dark'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-azt-blue'
              }`}
            >
              <option value="ticker">Scrolling Ticker Tape</option>
              <option value="swiper">Swiping Stock Cards</option>
              <option value="condensed">Condensed Scrolling Cards</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Theme
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-azt-blue ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-azt-blue-dark'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-azt-blue'
              }`}
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>
        </div>

        {/* Preview Section */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Live Preview
          </label>
          <div className={`border-2 rounded-md overflow-hidden relative ${
            isDarkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'
          }`}>
            <div className={`absolute top-2 left-2 px-2 py-1 text-xs rounded z-10 ${
              isDarkMode ? 'bg-gray-700/70 text-gray-300' : 'bg-gray-200/70 text-gray-600'
            }`}>
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

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Embed Code
          </label>
          <div className="relative">
            <textarea
              readOnly
              value={generateEmbedCode(selectedType, selectedTheme)}
              className={`w-full px-3 py-2 border rounded-md font-mono text-sm resize-none ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              rows={6}
            />
            <button
              onClick={copyToClipboard}
              className={`absolute top-2 right-2 px-3 py-1 text-sm rounded-md transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : isDarkMode
                    ? 'bg-azt-blue-dark text-white hover:bg-azt-blue'
                    : 'bg-azt-blue text-white hover:bg-azt-blue-dark'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
  );
};

export default EmbedCodeGenerator;