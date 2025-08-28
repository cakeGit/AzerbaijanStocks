import React from 'react';
import { useLeaderboard } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatting';
import { TrophyIcon, UserIcon } from '@heroicons/react/24/outline';

const Leaderboard = () => {
  const { leaderboard, loading, error } = useLeaderboard();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h2 className="text-xl font-semibold">Error Loading Leaderboard</h2>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-azt-blue text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <TrophyIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />;
      case 3:
        return <TrophyIcon className="h-6 w-6 text-yellow-700 dark:text-yellow-600" />;
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{rank}</span>
          </div>
        );
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 border-gray-200 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-yellow-50 to-orange-100 dark:from-orange-900/20 dark:to-yellow-800/20 border-orange-200 dark:border-orange-700';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Top traders ranked by net worth. Compete with other players!
        </p>
      </div>

      {/* Podium for Top 3 */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 2nd Place */}
          <div className="order-1 md:order-1">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 text-center border-2 border-gray-300 dark:border-gray-500">
              <div className="flex justify-center mb-3">
                <TrophyIcon className="h-12 w-12 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {leaderboard[1].username}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">#2</p>
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                {formatCurrency(leaderboard[1].netWorth)}
              </p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="order-2 md:order-2">
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-lg p-6 text-center border-2 border-yellow-400 dark:border-yellow-600 transform md:scale-110">
              <div className="flex justify-center mb-3">
                <TrophyIcon className="h-16 w-16 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {leaderboard[0].username}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">#1 Champion</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {formatCurrency(leaderboard[0].netWorth)}
              </p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 md:order-3">
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900 rounded-lg p-6 text-center border-2 border-orange-300 dark:border-orange-600">
              <div className="flex justify-center mb-3">
                <TrophyIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {leaderboard[2].username}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">#3</p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(leaderboard[2].netWorth)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            All Traders
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {leaderboard.map((trader, index) => (
            <div 
              key={trader.id}
              className={`p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 ${getRankColor(index + 1)}`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getRankIcon(index + 1)}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-full">
                    <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {trader.username}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Rank #{index + 1}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(trader.netWorth)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Net Worth</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Traders</h3>
            <p className="text-3xl font-bold text-azt-blue">
              {leaderboard.length}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Highest Net Worth</h3>
            <p className="text-2xl font-bold text-azt-green">
              {leaderboard.length > 0 ? formatCurrency(leaderboard[0].netWorth) : '$0.00'}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Average Net Worth</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {leaderboard.length > 0 
                ? formatCurrency(leaderboard.reduce((sum, trader) => sum + trader.netWorth, 0) / leaderboard.length)
                : '$0.00'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
