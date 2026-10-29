import React from 'react';
import {
  ArrowUpDown,
  X,
  Star,
  LayoutGrid,
  List,
} from 'lucide-react';
import { FilterState } from '../hooks/useActivities.js';

interface ActivityFiltersProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalActivities: number;
  exchangeCounts: Record<string, number>;
  favoriteCount: number;
}

const CATEGORIES = [
  'ALL',
  '交易竞赛',
  'Launchpool',
  '新币空投',
  '充值质押',
  '合约狂欢',
  '理财加息',
  '钱包活动',
  'Perp DEX 激励',
  '链上流动性激励',
  '借贷激励',
  '链上协议激励',
];

const STATUSES: Array<{ id: FilterState['selectedStatus']; label: string }> = [
  { id: 'ALL', label: '全部状态' },
  { id: 'endingSoon', label: '🔥 72h急迫' },
  { id: 'open', label: '进行中' },
  { id: 'upcoming', label: '即将开始' },
  { id: 'ended', label: '已结束' },
];

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
  totalActivities,
  favoriteCount,
}) => {
  const hasActiveFilters =
    filters.selectedExchange !== 'ALL' ||
    filters.selectedCategory !== 'ALL' ||
    filters.selectedStatus !== 'ALL' ||
    Boolean(filters.selectedDateStr) ||
    Boolean(filters.searchQuery) ||
    filters.onlyFavorites;

  return (
    <div data-tour="activity-tools" className="bg-[#111111] border border-[#222222] rounded p-3 mb-4 space-y-3">
      {/* Top Filter Bar: Status pills + Favorites toggle + View Mode + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status Pills + Favorites Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {STATUSES.map((st) => {
            const isSelected = filters.selectedStatus === st.id;
            const isUrgent = st.id === 'endingSoon';

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onFilterChange({ selectedStatus: st.id })}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium border ${
                  isSelected
                    ? isUrgent
                      ? 'bg-[#2a1d0d] text-amber-300 border-[#664619]'
                      : 'bg-[#222222] text-[#4ca6e1] border-[#333333]'
                    : isUrgent
                    ? 'bg-[#16140f] text-amber-400/80 border-[#2d2312] hover:border-[#4d3a1c]'
                    : 'bg-[#161616] text-[#a3a3a3] border-[#222222] hover:text-white hover:border-[#2e2e2e]'
                }`}
              >
                {st.label}
              </button>
            );
          })}

          <span className="text-[#2a2a2a] mx-0.5">|</span>

          {/* Starred / Favorites filter */}
          <button
            type="button"
            onClick={() => onFilterChange({ onlyFavorites: !filters.onlyFavorites })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium border ${
              filters.onlyFavorites
                ? 'bg-[#2d2711] text-amber-300 border-[#574619]'
                : 'bg-[#161616] text-[#a3a3a3] border-[#222222] hover:text-white'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                filters.onlyFavorites ? 'fill-amber-400 text-amber-400' : 'text-[#949494]'
              }`}
            />
            <span>我的关注</span>
            {favoriteCount > 0 && (
              <span className="px-1 py-0.2 rounded font-mono text-[10px] bg-[#222222] text-amber-300">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>

        {/* Right side: View Mode Toggle & Sorting */}
        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <div className="inline-flex rounded bg-[#161616] p-0.5 border border-[#262626]">
            <button
              type="button"
              aria-label="卡片视图"
              title="卡片列表视图"
              onClick={() => onFilterChange({ viewMode: 'cards' })}
              className={`p-1.5 rounded transition-colors ${
                filters.viewMode === 'cards'
                  ? 'bg-[#242424] text-[#4ca6e1]'
                  : 'text-[#949494] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="紧凑矩阵视图"
              title="紧凑表格视图"
              onClick={() => onFilterChange({ viewMode: 'compact' })}
              className={`p-1.5 rounded transition-colors ${
                filters.viewMode === 'compact'
                  ? 'bg-[#242424] text-[#4ca6e1]'
                  : 'text-[#949494] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#949494] hidden sm:inline">排序:</span>
            <div className="inline-flex rounded bg-[#161616] p-0.5 border border-[#262626]">
              <button
                type="button"
                onClick={() => onFilterChange({ sortBy: 'newest' })}
                className={`px-2 py-1 text-xs rounded transition-colors font-medium ${
                  filters.sortBy === 'newest'
                    ? 'bg-[#242424] text-[#4ca6e1]'
                    : 'text-[#949494] hover:text-white'
                }`}
              >
                最新发布
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ sortBy: 'endingSoon' })}
                className={`px-2 py-1 text-xs rounded transition-colors font-medium ${
                  filters.sortBy === 'endingSoon'
                    ? 'bg-[#242424] text-[#4ca6e1]'
                    : 'text-[#949494] hover:text-white'
                }`}
              >
                即将结束
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ sortBy: 'rewardScale' })}
                className={`px-2 py-1 text-xs rounded transition-colors font-medium ${
                  filters.sortBy === 'rewardScale'
                    ? 'bg-[#242424] text-[#4ca6e1]'
                    : 'text-[#949494] hover:text-white'
                }`}
              >
                奖池规模
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category selector row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1d1d1d]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-[#949494] mr-1">类型:</span>
          {CATEGORIES.map((cat) => {
            const isSelected = filters.selectedCategory === cat;
            const label = cat === 'ALL' ? '全部类型' : cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onFilterChange({ selectedCategory: cat })}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  isSelected
                    ? 'bg-[#242424] text-white font-medium border border-[#383838]'
                    : 'text-[#949494] hover:text-[#d1d5db] hover:bg-[#181818]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#949494]">
            显示 <strong className="text-white font-mono">{totalFiltered}</strong> / {totalActivities} 项
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] text-[#4ca6e1] hover:text-white px-1.5 py-0.5 rounded bg-[#16222b] border border-[#223b4d] transition-colors"
            >
              <X className="w-3 h-3" />
              <span>重置条件</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
