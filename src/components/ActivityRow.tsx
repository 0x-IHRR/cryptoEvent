import React, { useState } from 'react';
import {
  Clock,
  ChevronRight,
  Star,
  Share2,
  Check,
  Clipboard,
} from 'lucide-react';
import { Activity } from '../types/activity.js';
import {
  formatTimeRemaining,
  formatDateRange,
  generateActivityShareText,
  generateActivityResearchPrompt,
  getRewardMetricLabel,
} from '../utils/activity.js';
import { getChineseActivityTitle } from '../utils/activity-localization.js';

interface ActivityRowProps {
  activity: Activity;
  onOpenDetails: (activity: Activity) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  viewMode?: 'cards' | 'compact';
}

const EXCHANGE_ACCENTS: Record<string, { bg: string; text: string; border: string }> = {
  Binance: { bg: 'bg-[#2b2510]', text: 'text-amber-400', border: 'border-[#4a3f1a]' },
  OKX: { bg: 'bg-[#181818]', text: 'text-white', border: 'border-[#383838]' },
  Bitget: { bg: 'bg-[#10242b]', text: 'text-cyan-400', border: 'border-[#1b4352]' },
  Bybit: { bg: 'bg-[#2b2210]', text: 'text-amber-300', border: 'border-[#473617]' },
  Gate: { bg: 'bg-[#221029]', text: 'text-fuchsia-300', border: 'border-[#421d52]' },
  HTX: { bg: 'bg-[#0f1f2e]', text: 'text-blue-400', border: 'border-[#173a57]' },
  MEXC: { bg: 'bg-[#102919]', text: 'text-emerald-400', border: 'border-[#1c4d2d]' },
  KuCoin: { bg: 'bg-[#11272b]', text: 'text-teal-300', border: 'border-[#1d474e]' },
  Paradex: { bg: 'bg-[#201c2b]', text: 'text-violet-300', border: 'border-[#42355c]' },
  Aster: { bg: 'bg-[#2b2412]', text: 'text-amber-300', border: 'border-[#514322]' },
  Lighter: { bg: 'bg-[#1b2531]', text: 'text-sky-300', border: 'border-[#2e465b]' },
  Merkl: { bg: 'bg-[#18251d]', text: 'text-emerald-300', border: 'border-[#2d4938]' },
};

export const ActivityRow: React.FC<ActivityRowProps> = ({
  activity,
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
  viewMode = 'cards',
}) => {
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const isUrgent = activity.status === 'endingSoon';
  const isEnded = activity.status === 'ended';
  const isUpcoming = activity.status === 'upcoming';
  const accent = EXCHANGE_ACCENTS[activity.exchange] || EXCHANGE_ACCENTS.OKX;
  const displayTitle = getChineseActivityTitle(activity) || activity.title;
  const rewardMetricLabel = getRewardMetricLabel(activity);

  const timeRemainingText = formatTimeRemaining(activity.endsAt);
  const dateRangeText = formatDateRange(activity.startsAt, activity.endsAt);

  const formattedVerifiedTime = activity.verifiedAt
    ? activity.verifiedAt.slice(5, 16).replace('T', ' ')
    : '近期';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = generateActivityShareText(activity);
    navigator.clipboard?.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = generateActivityResearchPrompt(activity);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(activity.id);
  };

  /* Compact Table Mode */
  if (viewMode === 'compact') {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`查看活动详情: ${activity.exchange} ${displayTitle}`}
        onClick={() => onOpenDetails(activity)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetails(activity);
          }
        }}
        className={`group flex items-center justify-between p-2.5 px-3 rounded bg-[#111111] hover:bg-[#161616] border transition-all cursor-pointer text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ca6e1] ${
          isUrgent ? 'border-[#382b13] hover:border-[#523d19]' : 'border-[#222222] hover:border-[#333333]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Star favorite */}
          <button
            type="button"
            aria-label={isFavorite ? '取消关注' : '加入关注'}
            onClick={handleStar}
            className="p-1 rounded text-[#949494] hover:text-amber-400 transition-colors shrink-0"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFavorite ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>

          {/* Exchange badge */}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${accent.bg} ${accent.text} ${accent.border}`}
          >
            {activity.protocolName || activity.exchange}
          </span>

          {/* Clean unboxed category metadata with separator */}
          <span className="hidden sm:inline text-xs text-[#a3a3a3] shrink-0">
            {activity.category}
          </span>
          <span className="hidden sm:inline text-[#3a3a3a] shrink-0" aria-hidden="true">·</span>

          {/* Title */}
          <span className="font-medium text-white truncate group-hover:text-[#4ca6e1] transition-colors">
            {displayTitle}
          </span>
        </div>

        {/* Right side data & actions */}
        <div className="flex items-center gap-3.5 flex-shrink-0 ml-3">
          {/* Countdown */}
          <span
            className={`text-xs font-mono hidden md:inline tabular-nums ${
              isUrgent ? 'text-amber-300 font-semibold' : 'text-[#949494]'
            }`}
          >
            {timeRemainingText}
          </span>

          {/* Reward */}
          <div className="text-right min-w-[90px]">
            <span className="block text-[9px] text-[#949494] uppercase tracking-wider">{rewardMetricLabel}</span>
            <span className="font-mono font-bold text-white text-xs tabular-nums">
              {activity.rewardDisplay}
            </span>
          </div>

          {/* 1-Click Copy AI Prompt Button */}
          <button
            type="button"
            aria-label="一键复制 AI 活动研究 Prompt"
            title="一键复制 AI 活动研究 Prompt (直接发送给大模型制定策略)"
            onClick={handleCopyPrompt}
            className={`flex items-center gap-1 h-7 px-2 rounded text-[11px] font-medium border transition-colors ${
              copiedPrompt
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                : 'bg-[#181818] hover:bg-[#222222] text-[#4ca6e1] border-[#2e2e2e]'
            }`}
          >
            {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3 text-[#4ca6e1]" />}
            <span className="hidden lg:inline">{copiedPrompt ? '已复制' : '复制Prompt'}</span>
          </button>

          {/* Quick copy share */}
          <button
            type="button"
            aria-label="复制活动速览"
            title="复制活动简要信息"
            onClick={handleShare}
            className="p-1.5 rounded text-[#949494] hover:text-white hover:bg-[#1f1f1f] transition-colors"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <ChevronRight className="w-4 h-4 text-[#949494] group-hover:text-white transition-colors" />
        </div>
      </div>
    );
  }

  /* Default Card Mode */
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`查看活动详情: ${activity.exchange} ${displayTitle}`}
      onClick={() => onOpenDetails(activity)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(activity);
        }
      }}
      className={`group w-full p-4 rounded-lg bg-[#111111] hover:bg-[#151515] active:bg-[#131313] border transition-all cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ca6e1] ${
        isUrgent
          ? 'border-[#382b13] hover:border-[#523d19]'
          : 'border-[#222222] hover:border-[#333333]'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left section: Exchange badge + Title + Category + Dates */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Top metadata row with Zero-Pill discipline */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Star button */}
            <button
              type="button"
              aria-label={isFavorite ? '取消关注' : '关注此活动'}
              onClick={handleStar}
              className="p-0.5 rounded text-[#949494] hover:text-amber-400 transition-colors"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isFavorite ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>

            {/* Exchange Tag */}
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wide border ${accent.bg} ${accent.text} ${accent.border}`}
            >
              {activity.protocolName || activity.exchange}
            </span>

            {/* Category as clean unboxed text */}
            <span className="text-xs text-[#d1d5db]">
              {activity.category}
            </span>

            <span className="text-[#3a3a3a]" aria-hidden="true">·</span>

            {/* Status Text */}
            {isUrgent && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>72h 急迫 ({timeRemainingText})</span>
              </span>
            )}
            {!isUrgent && !isEnded && !isUpcoming && (
              <span className="text-[11px] text-emerald-400 font-mono">
                进行中
              </span>
            )}
            {isUpcoming && (
              <span className="text-[11px] text-[#4ca6e1] font-mono">
                即将开启
              </span>
            )}
            {isEnded && (
              <span className="text-[11px] text-[#949494] font-mono">
                已截止
              </span>
            )}

            <span className="text-[#3a3a3a]" aria-hidden="true">·</span>

            {/* KYC note */}
            {activity.kycRequired === true ? (
              <span className="text-[11px] text-[#949494] font-mono">需KYC</span>
            ) : activity.kycRequired === false ? (
              <span className="text-[11px] text-emerald-400/90 font-mono">免KYC</span>
            ) : (
              <span className="text-[11px] text-amber-300/80 font-mono">KYC未注</span>
            )}

            {/* Chain if provided */}
            {activity.chainName && (
              <>
                <span className="text-[#3a3a3a]" aria-hidden="true">·</span>
                <span className="text-[11px] text-[#949494] font-mono">{activity.chainName}</span>
              </>
            )}
          </div>

          {/* Activity Title */}
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight group-hover:text-[#4ca6e1] transition-colors line-clamp-2 leading-snug">
            {displayTitle}
          </h3>

          {/* Secondary Details: Date Range + Verification */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#949494]">
            <div className="flex items-center gap-1 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#949494]" />
              <span>{dateRangeText}</span>
            </div>
            <span className="text-[#333333]" aria-hidden="true">·</span>
            <span className="text-[11px] font-mono tabular-nums">
              核验于 {formattedVerifiedTime}
            </span>
          </div>
        </div>

        {/* Right section: Reward metric & Action Buttons */}
        <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1c1c1c] flex-shrink-0">
          <div className="text-left lg:text-right min-w-[110px]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#949494]">
              {rewardMetricLabel}
            </div>
            <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-white group-hover:text-[#4ca6e1] transition-colors tabular-nums">
              {activity.rewardDisplay}
            </div>
            {activity.rewardAmount && (
              <div className="text-[10px] font-mono text-[#949494]">
                {activity.rewardCurrency}
              </div>
            )}
          </div>

          {/* 1-Click Copy AI Prompt Button */}
          <button
            type="button"
            aria-label="复制 AI 活动研究 Prompt"
            title="一键复制本活动的研究 Prompt（可直接发送给 ChatGPT、Claude、DeepSeek 制定策略）"
            onClick={handleCopyPrompt}
            className={`flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold border transition-all cursor-pointer ${
              copiedPrompt
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm'
                : 'bg-[#162533] hover:bg-[#1d354a] text-[#4ca6e1] hover:text-white border-[#234559]'
            }`}
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>已复制 Prompt</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5 text-[#4ca6e1]" />
                <span>复制 AI Prompt</span>
              </>
            )}
          </button>

          {/* Copy Share Button */}
          <button
            type="button"
            aria-label="复制活动速览"
            title="复制简要信息"
            onClick={handleShare}
            className="p-2 rounded bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] text-[#949494] hover:text-white transition-colors cursor-pointer"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <div className="w-8 h-8 rounded bg-[#181818] group-hover:bg-[#222222] border border-[#2b2b2b] flex items-center justify-center text-[#949494] group-hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
