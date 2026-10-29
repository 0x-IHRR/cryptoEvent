import React from 'react';
import {
  Layers,
  Calendar,
  Activity as PulseIcon,
  ShieldCheck,
  ExternalLink,
  X,
  Radio,
  Zap,
} from 'lucide-react';
import { ExchangeId } from '../types/activity.js';

interface SidebarProps {
  currentTab: 'board' | 'sources' | 'security';
  setCurrentTab: (tab: 'board' | 'sources' | 'security') => void;
  selectedExchange: ExchangeId | 'ALL';
  onSelectExchange: (exchange: ExchangeId | 'ALL') => void;
  exchangeCounts: Record<string, number>;
  urgentCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  selectedExchange,
  onSelectExchange,
  exchangeCounts,
  urgentCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-[#111111] text-[#f3f4f6] border-r border-[#222222]">
      {/* Brand & Title */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#222222]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#4ca6e1] font-mono font-bold text-sm tracking-wider">
            EX
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-white leading-tight">
              交易所活动榜
            </span>
            <span className="text-[10px] font-mono text-[#949494] tracking-wider uppercase">
              Activity Radar v1.0
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          aria-label="关闭侧边菜单"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded text-[#949494] hover:text-white hover:bg-[#222222] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-1">
        <button
          type="button"
          onClick={() => {
            setCurrentTab('board');
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
            currentTab === 'board'
              ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
              : 'text-[#d1d5db] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#4ca6e1]" />
            <span>奖池活动总榜</span>
          </div>
          {urgentCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1a2e3b] text-[#4ca6e1] border border-[#234559]">
              {urgentCount} 急迫
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentTab('sources');
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
            currentTab === 'sources'
              ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
              : 'text-[#d1d5db] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <PulseIcon className="w-4 h-4 text-[#949494]" />
            <span>数据源健康监控</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentTab('security');
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
            currentTab === 'security'
              ? 'bg-[#222222] text-[#4ca6e1] border border-[#333333]'
              : 'text-[#d1d5db] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#949494]" />
            <span>官方白名单规范</span>
          </div>
          <span className="text-[10px] text-[#949494] font-mono">8家</span>
        </button>
      </div>

      {/* Exchange Quick Filter Directory */}
      <div className="px-3 pt-3 pb-1 border-t border-[#222222]">
        <div className="px-2 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#949494]">
            覆盖交易所 (8家)
          </span>
          <span className="text-[10px] text-[#949494]">
            {exchangeCounts['ALL'] || 0} 个活动
          </span>
        </div>

        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSelectExchange('ALL');
              if (currentTab !== 'board') setCurrentTab('board');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
              selectedExchange === 'ALL' && currentTab === 'board'
                ? 'bg-[#222222] text-white font-medium border border-[#333333]'
                : 'text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#f3f4f6]'
            }`}
          >
            <span>全部交易所</span>
            <span className="text-[10px] font-mono text-[#949494]">
              {exchangeCounts['ALL'] || 0}
            </span>
          </button>

          {EXCHANGES.map((ex) => {
            const count = exchangeCounts[ex] || 0;
            const isSelected = selectedExchange === ex && currentTab === 'board';
            const isManualFallback = ex === 'Gate' || ex === 'MEXC';

            return (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  onSelectExchange(ex);
                  if (currentTab !== 'board') setCurrentTab('board');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#222222] text-[#4ca6e1] font-medium border border-[#333333]'
                    : 'text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#f3f4f6]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isManualFallback ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>{ex === 'Merkl' ? '链上 DEX / 借贷' : ex}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isManualFallback && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#2a2a2a] text-[#949494]">
                      补录
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[#949494]">{count}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="mt-auto p-3 border-t border-[#222222] bg-[#0c0c0c]">
        <div className="p-2.5 rounded bg-[#161616] border border-[#222222] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#949494]">更新频率</span>
            <span className="font-mono text-[#d1d5db]">30分钟缓存</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#949494]">官方校验</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              白名单防钓鱼
            </span>
          </div>
          <div className="pt-1 border-t border-[#222222] text-[10px] text-[#949494] leading-tight">
            免登录公开看板 · 仅索引官方直达活动
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed 224px sidebar */}
      <aside className="hidden md:block w-[224px] flex-shrink-0 h-screen sticky top-0 z-30 select-none">
        {content}
      </aside>

      {/* Mobile drawer backdrop and overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-[240px] max-w-[80vw] h-full z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
