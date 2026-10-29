import React, { useState } from 'react';
import {
  Layers,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  Sparkles,
  Inbox,
  Flame,
  Clock,
} from 'lucide-react';
import { useActivities } from './hooks/useActivities.js';
import { TopNav } from './components/TopNav.js';
import { SevenDayHorizon } from './components/SevenDayHorizon.js';
import { ActivityFilters } from './components/ActivityFilters.js';
import { ActivityRow } from './components/ActivityRow.js';
import { ActivityDetailDrawer } from './components/ActivityDetailDrawer.js';
import { SourceHealthView } from './components/SourceHealthView.js';
import { SecurityPolicyView } from './components/SecurityPolicyView.js';
import { OnboardingTour } from './components/OnboardingTour.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'board' | 'sources' | 'security'>('board');
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('has_seen_activity_radar_tour');
    } catch {
      return false;
    }
  });

  const {
    activities,
    filteredActivities,
    sources,
    stats,
    sevenDayHorizon,
    exchangeCounts,
    filters,
    setFilters,
    favoriteIds,
    toggleFavorite,
    selectedActivity,
    setSelectedActivity,
    updatedAt,
    isLoading,
    isRefreshing,
    error,
    refreshData,
  } = useActivities();

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedExchange: 'ALL',
      selectedCategory: 'ALL',
      selectedStatus: 'ALL',
      selectedDateStr: null,
      sortBy: 'newest',
    });
  };

  const formattedTotalReward = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(stats.totalUsd);
  const operationalSourceCount = sources.filter((source) => source.status === 'operational').length;

  return (
    <div className="min-h-screen bg-[#000000] text-[#f3f4f6] flex flex-col antialiased font-sans">
      {/* Top Navigation Bar with View Tabs and Exchange Filter Sub-bar */}
      <TopNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedExchange={filters.selectedExchange}
        onSelectExchange={(ex) => setFilters({ selectedExchange: ex })}
        exchangeCounts={exchangeCounts}
        urgentCount={stats.endingSoonCount}
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => setFilters({ searchQuery: q })}
        isRefreshing={isRefreshing}
        onRefresh={refreshData}
        totalRewardUsdValue={stats.totalUsd}
        openCount={stats.openCount}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {currentTab === 'board' && (
          <div className="space-y-6">
            {/* Top Fold Hero: Answers "目前有哪些可以参加、即将截止的奖池活动？" */}
            <section
              data-tour="hero-stats"
              className="bg-[#111111] border border-[#222222] rounded p-5 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1a2833] text-[#4ca6e1] border border-[#234257] uppercase tracking-wider">
                      活动来源核验状态
                    </span>
                    <span className="text-xs text-[#949494]">
                      已接入 {operationalSourceCount} 个来源：交易所活动、OKX Wallet、3 个 Perp DEX 与 Merkl 链上奖励
                    </span>
                  </div>

                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                    目前有哪些可以参加、即将截止的奖池活动？
                  </h1>

                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    当前收录 {activities.length} 条官方来源候选活动。奖池、资格与截止时间以活动官方页面为准；未披露的信息保持未核实，七日截止带只统计已知截止日期。
                  </p>
                </div>

                {/* Summary Metric Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-shrink-0">
                  {/* Active */}
                  <div className="p-3 rounded bg-[#161616] border border-[#262626] min-w-[110px]">
                    <div className="text-[10px] font-mono text-[#949494] uppercase">
                      进行中活动
                    </div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {stats.openCount}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">活动进行中，资格需核实</div>
                  </div>

                  {/* 72h Urgent */}
                  <button
                    type="button"
                    onClick={() => setFilters({ selectedStatus: 'endingSoon' })}
                    className="p-3 rounded bg-[#1a140b] hover:bg-[#241a0d] border border-[#3d2c12] min-w-[110px] text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1 uppercase">
                      <Flame className="w-3 h-3" />
                      <span>72h 急迫</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                      {stats.endingSoonCount}
                    </div>
                    <div className="text-[10px] text-[#949494] mt-0.5">点击筛选急迫</div>
                  </button>

                  {/* Upcoming */}
                  <div className="p-3 rounded bg-[#161616] border border-[#262626] min-w-[110px]">
                    <div className="text-[10px] font-mono text-[#949494] uppercase">
                      即将开始
                    </div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {stats.upcomingCount}
                    </div>
                    <div className="text-[10px] text-[#949494] mt-0.5">预热筹备中</div>
                  </div>

                  {/* Total USD Value */}
                  <div className="p-3 rounded bg-[#161616] border border-[#262626] min-w-[125px]">
                    <div className="text-[10px] font-mono text-[#949494] uppercase">
                      官方总奖池
                    </div>
                    <div className="text-base sm:text-lg font-bold font-mono text-[#4ca6e1] mt-0.5 truncate">
                      {formattedTotalReward}
                    </div>
                    <div className="text-[10px] text-[#949494] mt-0.5">稳定币价值</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Exclusive Feature: 七日截止带 (7-Day Ending Horizon) */}
            <SevenDayHorizon
              days={sevenDayHorizon}
              selectedDateStr={filters.selectedDateStr}
              onSelectDay={(dateStr) => setFilters({ selectedDateStr: dateStr })}
              urgentCount={stats.endingSoonCount}
            />

            {/* Filter Controls Bar */}
            <ActivityFilters
              filters={filters}
              onFilterChange={(updates) => setFilters(updates)}
              onResetFilters={handleResetFilters}
              totalFiltered={filteredActivities.length}
              totalActivities={activities.length}
              exchangeCounts={exchangeCounts}
              favoriteCount={favoriteIds.length}
            />

            {/* Activity List Container */}
            <section
              aria-label="活动列表"
              className={filters.viewMode === 'compact' ? 'space-y-1.5' : 'space-y-2.5'}
            >
              {isLoading && (
                <div className="p-12 text-center bg-[#111111] border border-[#222222] rounded space-y-3">
                  <RefreshCw className="w-6 h-6 text-[#4ca6e1] animate-spin mx-auto" />
                  <p className="text-xs text-[#949494] font-mono">
                    正在从 8 家交易所官方解析最新活动...
                  </p>
                </div>
              )}

              {!isLoading && filteredActivities.length === 0 && (
                <div className="p-12 text-center bg-[#111111] border border-[#222222] rounded space-y-3">
                  <Inbox className="w-8 h-8 text-[#949494] mx-auto opacity-60" />
                  <h3 className="text-sm font-semibold text-white">未找到匹配的活动</h3>
                  <p className="text-xs text-[#949494] max-w-sm mx-auto">
                    当前筛选条件没有匹配到正在进行或符合条件的交易所活动。建议清除部分筛选标签重试。
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#222222] hover:bg-[#2c2c2c] text-xs text-[#4ca6e1] border border-[#333333] transition-colors"
                  >
                    <span>重置所有筛选</span>
                  </button>
                </div>
              )}

              {!isLoading &&
                filteredActivities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    onOpenDetails={(act) => setSelectedActivity(act)}
                    isFavorite={favoriteIds.includes(activity.id)}
                    onToggleFavorite={toggleFavorite}
                    viewMode={filters.viewMode}
                  />
                ))}
            </section>
          </div>
        )}

        {/* Sources Health View */}
        {currentTab === 'sources' && (
          <SourceHealthView
            sources={sources}
            updatedAt={updatedAt}
            isRefreshing={isRefreshing}
            onRefresh={refreshData}
            onSelectExchange={(ex) => setFilters({ selectedExchange: ex })}
            onGoToBoard={() => setCurrentTab('board')}
          />
        )}

        {/* Security & Whitelist View */}
        {currentTab === 'security' && <SecurityPolicyView />}
      </main>

      {/* Accessible Detail Drawer */}
      <ActivityDetailDrawer
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        isFavorite={selectedActivity ? favoriteIds.includes(selectedActivity.id) : false}
        onToggleFavorite={toggleFavorite}
      />

      {/* Interactive Step-by-Step Onboarding Guide */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('has_seen_activity_radar_tour', 'true');
          } catch {
            // ignore localStorage quota error
          }
        }}
      />
    </div>
  );
}
