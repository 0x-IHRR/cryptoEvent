import React, { useState, useEffect } from 'react';
import { Menu, Search, RefreshCw, Clock, DollarSign, Zap } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  updatedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  totalRewardUsdValue: number;
  openCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  searchQuery,
  onSearchChange,
  updatedAt,
  isRefreshing,
  onRefresh,
  totalRewardUsdValue,
  openCount,
}) => {
  const [currentUtc, setCurrentUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcStr = now.toISOString().substring(11, 19) + ' UTC';
      setCurrentUtc(utcStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedUsd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalRewardUsdValue);

  return (
    <header className="h-16 px-4 md:px-6 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile hamburger & live badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="打开交易所与活动菜单"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded text-[#949494] hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#161616] border border-[#262626]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-[#a3a3a3]">
            进行中 <strong className="font-mono text-white">{openCount}</strong> 个官方奖池
          </span>
          <span className="text-[#333333]">|</span>
          <span className="text-xs font-mono text-[#4ca6e1] font-medium">
            {formattedUsd}
          </span>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#949494]" />
          <input
            type="text"
            aria-label="搜索交易所活动、代币或奖池"
            placeholder="搜索活动名称、币种、交易所或规则..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-[#141414] border border-[#2a2a2a] focus:border-[#4ca6e1] focus:outline-none rounded text-xs text-[#f3f4f6] placeholder-[#949494] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#949494] hover:text-white px-1 py-0.5"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* Right: UTC Time & Refresh */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#949494] font-mono">
          <Clock className="w-3.5 h-3.5 text-[#949494]" />
          <span>{currentUtc || '12:00:00 UTC'}</span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="刷新交易所活动数据"
          title="重新抓取与同步数据"
          className="flex items-center gap-1.5 h-8 px-2.5 rounded bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#222222] border border-[#2a2a2a] text-xs font-medium text-[#d1d5db] hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#4ca6e1] ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span className="hidden sm:inline">
            {isRefreshing ? '同步中...' : '同步'}
          </span>
        </button>
      </div>
    </header>
  );
};
