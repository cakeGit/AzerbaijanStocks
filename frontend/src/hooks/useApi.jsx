import { useState, useEffect } from 'react';
import { stocksApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export const useStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await stocksApi.getAllStocks();
      setStocks(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch stocks');
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  return { stocks, loading, error, refetch: fetchStocks };
};

export const useStockHistory = (ticker, period = '1D', granularity = 'minute') => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await stocksApi.getStockHistory(ticker, period, granularity);
        // The server now returns an object with data property
        const historyData = response.data.data || response.data;
        setHistory(historyData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch stock history');
        console.error('Error fetching stock history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [ticker, period, granularity]);

  return { history, loading, error };
};

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchPortfolio = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await stocksApi.getUserPortfolio(user.id);
      setPortfolio(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch portfolio');
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePortfolio = async (action, ticker, shares, price) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await stocksApi.updatePortfolio(user.id, {
        action,
        ticker,
        shares,
        price,
      });
      setPortfolio(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating portfolio:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to update portfolio' };
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  return { portfolio, loading, error, updatePortfolio, refetch: fetchPortfolio };
};

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await stocksApi.getLeaderboard();
      setLeaderboard(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return { leaderboard, loading, error, refetch: fetchLeaderboard };
};

export const usePortfolioHistory = (userId, period = '1D', granularity = 'minute') => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await stocksApi.getPortfolioHistory(userId, period, granularity);
        const historyData = response.data.data || response.data;
        setHistory(historyData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch portfolio history');
        console.error('Error fetching portfolio history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, period, granularity]);

  return { history, loading, error };
};

export const useActiveTraders = () => {
  const [activeTraders, setActiveTraders] = useState({ count: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveTraders = async () => {
    try {
      setLoading(true);
      const response = await stocksApi.getActiveTraders();
      setActiveTraders({
        count: response.data.count,
        totalUsers: response.data.totalUsers
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch active traders count');
      console.error('Error fetching active traders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTraders();
    const interval = setInterval(fetchActiveTraders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { activeTraders, loading, error, refetch: fetchActiveTraders };
};
