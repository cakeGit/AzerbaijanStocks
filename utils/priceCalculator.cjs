/**
 * Common price calculation utilities for the AZT Stock Exchange
 */

/**
 * Convert downloads and download rate to stock price
 * @param {number} downloads - Number of downloads
 * @param {number} downloadRate - Download rate (downloads per day)
 * @returns {number} Calculated stock price
 */
function convertDownloadsToPrice(downloads, downloadRate = 0) {
  // Pricing formula: (downloads / 10000) * 0.3 + (downloadRate / 10) * 0.7
  const downloadsComponent = (downloads / 10000) * 0.3;
  const rateComponent = (downloadRate / 10) * 0.7;
  return Math.max(1, (downloadsComponent + rateComponent) / 10);
}

/**
 * Calculate fair value based on downloads (same as convertDownloadsToPrice for backward compatibility)
 * @param {number} downloads - Number of downloads
 * @param {number} downloadRate - Download rate (downloads per day)
 * @returns {number} Calculated fair value
 */
function calculateFairValue(downloads, downloadRate = 0) {
  return convertDownloadsToPrice(downloads, downloadRate);
}

module.exports = {
  convertDownloadsToPrice,
  calculateFairValue
};
