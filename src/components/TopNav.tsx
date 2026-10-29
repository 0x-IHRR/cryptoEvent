import React, { useState, useEffect } from 'react';
import {
  Layers,
  Activity as PulseIcon,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  Menu,
  X,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { ExchangeId } from '../types/activity.js';
import { BrandLogo } from './BrandLogo.js';

interface TopNavProps {
  currentTab: 'board' | 'sources' | 'security';
  setCurrentTab: (tab: 'board' | 'sources' | 'security') => void;
  selectedExchange: ExchangeId | 'ALL';
  onSelectExchange: (exchange: ExchangeId | 'ALL') => void;
  exchangeCounts: Record<string, number>;
  urgentCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  totalRewardUsdValue: number;
  openCount: number;
  onOpenTour?: () => void;
}

const EXCHANGES: ExchangeId[] = [
  'Binance',
  'OKX',
  'Bitget',
  'Bybit',
  'Gate',
  'HTX',
  'MEXC',
  'KuCoin',
  'Paradex',
  'Aster',
  'Lighter',
  'Merkl',
];

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  setCurrentTab,
  selectedExchange,
  onSelectExchange,
  exchangeCounts,
  urgentCount,
  searchQuery,
  onSearchChange,
  isRefreshing,
  onRefresh,
  totalRewardUsdValue,
  openCount,
  onOpenTour,
}) => {
  const [currentUtc, setCurrentUtc] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtc(now.toISOString().substring(11, 19) + ' UTC');
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
    <header className="sticky top-0 z-40 bg-[#0c0c0c] border-b border-[#222222]">
      {/* Primary Top Bar (64px) */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            type="button"
            aria-label="切换菜单"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded text-[#949494] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('board')}
            className="flex items-center gap-2.5 cursor-pointer select-none group text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ca6e1] rounded px-1 -ml-1 transition-opacity hover:opacity-90"
          >
            <BrandLogo size={30} />
            <span className="font-bold text-base tracking-tight text-white group-hover:text-[#4ca6e1] transition-colors whitespace-nowrap">
              交易所活动榜
            </span>
          </button>

          {/* Desktop Primary View Tabs */}
          <nav aria-label="顶部主要导航" className="hidden md:flex items-center gap-1.5 ml-3">
            <button
              type="button"
              onClick={() => setCurrentTab('board')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentTab === 'board'
                  ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
                  : 'text-[#d1d5db] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#4ca6e1]" />
              <span>奖池活动总榜</span>
              {urgentCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#1a2e3b] text-[#4ca6e1] border border-[#234559]">
                  {urgentCount}急迫
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('sources')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentTab === 'sources'
                  ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
                  : 'text-[#d1d5db] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <PulseIcon className="w-3.5 h-3.5 text-[#949494]" />
              <span>数据源健康监控</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('security')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentTab === 'security'
                  ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
                  : 'text-[#d1d5db] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#949494]" />
              <span>官方白名单规范</span>
            </button>
          </nav>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-sm hidden lg:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#949494]" />
            <input
              type="text"
              aria-label="搜索交易所活动、代币或奖池"
              placeholder="搜索活动、代币、交易所..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#141414] border border-[#2a2a2a] focus:border-[#4ca6e1] focus:outline-none rounded text-xs text-[#f3f4f6] placeholder-[#949494] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#949494] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Stats, UTC clock & Refresh */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#161616] border border-[#262626]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[#a3a3a3]">
              总奖池 <strong className="font-mono text-[#4ca6e1]">{formattedUsd}</strong>
            </span>
          </div>

          {onOpenTour && (
            <button
              type="button"
              onClick={onOpenTour}
              aria-label="打开新手引导与策略教程"
              title="查看平台功能指引与套利教程"
              className="flex items-center gap-1.5 h-8 px-2.5 rounded bg-[#162533] hover:bg-[#1d3345] active:bg-[#162533] border border-[#234559] text-xs font-medium text-[#4ca6e1] hover:text-white transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#4ca6e1]" />
              <span className="hidden sm:inline">新手引导</span>
            </button>
          )}

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
              {isRefreshing ? '同步中' : '同步'}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary Top Sub-Bar: Exchange Pill Navigation */}
      {currentTab === 'board' && (
        <div data-tour="exchange-pills" className="bg-[#111111] border-t border-[#1f1f1f] px-4 md:px-6 py-2">
          <div className="max-w-7xl mx-auto md:px-6 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              {/* All Exchanges */}
              <button
                type="button"
                onClick={() => onSelectExchange('ALL')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium border ${
                  selectedExchange === 'ALL'
                    ? 'bg-[#222222] text-[#4ca6e1] border-[#383838]'
                    : 'bg-[#161616] text-[#a3a3a3] border-[#242424] hover:text-white hover:border-[#2e2e2e]'
                }`}
              >
                <span>全部</span>
                <span className="text-[10px] font-mono text-[#949494]">
                  {exchangeCounts['ALL'] || 0}
                </span>
              </button>

              {/* 8 Individual Exchanges */}
              {EXCHANGES.map((ex) => {
                const count = exchangeCounts[ex] || 0;
                const isSelected = selectedExchange === ex;
                const isManualFallback = ex === 'Gate' || ex === 'MEXC';

                return (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => onSelectExchange(ex)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors border ${
                      isSelected
                        ? 'bg-[#222222] text-[#4ca6e1] font-medium border-[#383838]'
                        : 'bg-[#161616] text-[#a3a3a3] border-[#242424] hover:text-white hover:border-[#2e2e2e]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isManualFallback ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                    <span>{ex}</span>
                    {isManualFallback && (
                      <span className="text-[9px] px-1 rounded bg-[#262626] text-[#949494]">
                        补录
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-[#949494]">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile search bar if on small screen */}
            <div className="lg:hidden min-w-[180px] max-w-[220px]">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#949494]" />
                <input
                  type="text"
                  placeholder="快速搜索..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full h-7 pl-7 pr-2 bg-[#161616] border border-[#2a2a2a] focus:border-[#4ca6e1] focus:outline-none rounded text-xs text-[#f3f4f6] placeholder-[#949494]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu when hamburger is clicked */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#111111] border-b border-[#222222] p-4 space-y-3">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setCurrentTab('board');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium ${
                currentTab === 'board'
                  ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
                  : 'text-[#d1d5db]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4ca6e1]" />
                <span>奖池活动总榜</span>
              </div>
              {urgentCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1a2e3b] text-[#4ca6e1]">
                  {urgentCount} 急迫
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('sources');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium ${
                currentTab === 'sources'
                  ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
                  : 'text-[#d1d5db]'
              }`}
            >
              <div className="flex items-center gap-2">
                <PulseIcon className="w-4 h-4 text-[#949494]" />
                <span>数据源健康监控</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('security');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium ${
                currentTab === 'security'
                  ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
                  : 'text-[#d1d5db]'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#949494]" />
                <span>官方白名单规范</span>
              </div>
              <span className="text-[10px] font-mono text-[#949494]">8家</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
