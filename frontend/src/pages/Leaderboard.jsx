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
          <div className="h-8 bg-muted rounded-xs w-1/4 mb-4"></div>
          <div className="bg-card rounded-xs shadow-sm border border-border p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-muted rounded-xs"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded-xs mb-2"></div>
                    <div className="h-3 bg-muted rounded-xs w-1/2"></div>
                  </div>
                  <div className="h-4 bg-muted rounded-xs w-20"></div>
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
        <div className="text-destructive mb-4">
          <h2 className="text-xl font-semibold">Error Loading Leaderboard</h2>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xs hover:bg-primary/90"
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
        return <TrophyIcon className="h-6 w-6 text-muted-foreground" />;
      case 3:
        return <TrophyIcon className="h-6 w-6 text-yellow-700" />;
      default:
        return (
          <div className="h-6 w-6 rounded-xs bg-muted flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">{rank}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Top traders ranked by net worth. Compete with other players!
        </p>
      </div>

      {/* Podium for Top 3 */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 2nd Place */}
          <div className="order-1 md:order-1">
            <div className="bg-muted rounded-xs p-6 text-center border border-border">
              <div className="flex justify-center mb-3">
                <TrophyIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {leaderboard[1].username}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">#2</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(leaderboard[1].netWorth)}
              </p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="order-2 md:order-2">
            <div className="bg-yellow-50 rounded-xs p-6 text-center border border-yellow-200">
              <div className="flex justify-center mb-3">
                <TrophyIcon className="h-16 w-16 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {leaderboard[0].username}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">#1 Champion</p>
              <p className="text-2xl font-bold text-yellow-700">
                {formatCurrency(leaderboard[0].netWorth)}
              </p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 md:order-3">
            <div className="bg-orange-50 rounded-xs p-6 text-center border border-orange-200">
              <div className="flex justify-center mb-3">
                <TrophyIcon className="h-12 w-12 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {leaderboard[2].username}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">#3</p>
              <p className="text-xl font-bold text-orange-700">
                {formatCurrency(leaderboard[2].netWorth)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-card rounded-xs shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            All Traders
          </h3>
        </div>
        
        <div className="divide-y divide-border">
          {leaderboard.map((trader, index) => (
            <div 
              key={trader.id}
              className="p-6 flex items-center justify-between hover:bg-accent/50 border-l-4 bg-card"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getRankIcon(index + 1)}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-xs">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">
                      {trader.username}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Rank #{index + 1}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(trader.netWorth)}
                </p>
                <p className="text-sm text-muted-foreground">Net Worth</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xs shadow-sm border border-border p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Total Traders</h3>
            <p className="text-3xl font-bold text-primary">
              {leaderboard.length}
            </p>
          </div>
        </div>
        
        <div className="bg-card rounded-xs shadow-sm border border-border p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Highest Net Worth</h3>
            <p className="text-2xl font-bold text-green-600">
              {leaderboard.length > 0 ? formatCurrency(leaderboard[0].netWorth) : '$0.00'}
            </p>
          </div>
        </div>
        
        <div className="bg-card rounded-xs shadow-sm border border-border p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Average Net Worth</h3>
            <p className="text-2xl font-bold text-foreground">
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
