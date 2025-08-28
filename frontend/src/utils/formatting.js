export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

export const formatPercentage = (value) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatChange = (change) => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}`;
};

export const getChangeColor = (change, isDarkMode = false) => {
  if (change > 0) return isDarkMode ? 'text-azt-green-dark' : 'text-azt-green';
  if (change < 0) return isDarkMode ? 'text-azt-red-dark' : 'text-azt-red';
  return isDarkMode ? 'text-gray-400' : 'text-gray-600';
};
