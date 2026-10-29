import React, { useState } from 'react';
import {
  Clock,
  ChevronRight,
  Database,
  FileCheck,
  Star,
  Share2,
  Check,
} from 'lucide-react';
import { Activity } from '../types/activity.js';
import { formatTimeRemaining, formatDateRange, generateActivityShareText, getRewardMetricLabel } from '../utils/activity.js';
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
  const [copied, setCopied] = useState<boolean>(false);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        className={`group flex items-center justify-between p-2.5 px-3 rounded bg-[#111111] hover:bg-[#161616] border transition-all cursor-pointer text-xs focus:outline-none focus:ring-1 focus:ring-[#4ca6e1] ${
          isUrgent ? 'border-[#382b13]' : 'border-[#222222]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Star favorite */}
          <button
            type="button"
            aria-label={isFavorite ? '取消关注' : '加入关注'}
            onClick={handleStar}
            className="p-1 rounded text-[#949494] hover:text-amber-400 transition-colors"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFavorite ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>

          {/* Exchange badge */}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${accent.bg} ${accent.text} ${accent.border}`}
          >
            {activity.protocolName || activity.exchange}
          </span>

          {/* Category */}
          <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-[#1a1a1a] text-[#949494] border border-[#2b2b2b]">
            {activity.category}
          </span>

          {/* Title */}
          <span className="font-medium text-white truncate group-hover:text-[#4ca6e1] transition-colors">
            {displayTitle}
          </span>
        </div>

        {/* Right side data */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-3">
          {/* Countdown badge */}
          <span
            className={`text-[11px] font-mono hidden md:inline ${
              isUrgent ? 'text-amber-300 font-semibold' : 'text-[#949494]'
            }`}
          >
            {timeRemainingText}
          </span>

          {/* Reward */}
          <div className="text-right min-w-[90px]">
            <span className="block text-[9px] text-[#949494]">{rewardMetricLabel}</span>
            <span className="font-mono font-bold text-white text-xs">
              {activity.rewardDisplay}
            </span>
          </div>

          {/* Quick copy share */}
          <button
            type="button"
            aria-label="复制活动速览"
            title="复制活动信息"
            onClick={handleShare}
            className="p-1 rounded text-[#949494] hover:text-white transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
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
      className={`group w-full p-3.5 sm:p-4 rounded bg-[#111111] hover:bg-[#161616] active:bg-[#131313] border transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#4ca6e1] ${
        isUrgent
          ? 'border-[#382b13] hover:border-[#57411a]'
          : 'border-[#222222] hover:border-[#2e2e2e]'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left section: Exchange badge + Title + Category + Dates */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Top meta tags */}
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

            {/* Category tag */}
            <span className="px-2 py-0.5 rounded text-[11px] bg-[#1a1a1a] text-[#d1d5db] border border-[#2b2b2b]">
              {activity.category}
            </span>

            {/* Status Badge */}
            {isUrgent && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#2a1d0d] text-amber-300 border border-[#664619]">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{timeRemainingText}</span>
              </span>
            )}
            {!isUrgent && !isEnded && !isUpcoming && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#102418] text-emerald-300 border border-[#1b4329]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>进行中</span>
              </span>
            )}
            {isUpcoming && (
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#10202e] text-[#4ca6e1] border border-[#1d3d57]">
                即将开启
              </span>
            )}
            {isEnded && (
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#181818] text-[#949494] border border-[#2b2b2b]">
                已截止
              </span>
            )}

            {/* Source Mode tag */}
            {activity.sourceMode === 'manual' ? (
              <span
                title="受上游防爬阻断限制，由系统合规人工持续核验补录"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#1e1c14] text-[#cfb263] border border-[#383321]"
              >
                <FileCheck className="w-2.5 h-2.5" />
                <span>人工核验</span>
              </span>
            ) : (
              <span
                title="采集来源标记；不代表规则已经核验"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#151c16] text-[#7ec295] border border-[#233526]"
              >
                <Database className="w-2.5 h-2.5" />
                <span>自动采集</span>
              </span>
            )}

            {/* KYC badge */}
            {activity.kycRequired === true ? (
              <span className="text-[10px] text-[#949494] font-mono">KYC需认证</span>
            ) : activity.kycRequired === false ? (
              <span className="text-[10px] text-emerald-400/90 font-mono">免KYC</span>
            ) : (
              <span className="text-[10px] text-amber-300 font-mono">KYC未核实</span>
            )}

            {/* Source-domain allowlist indicator */}
            <span
              title="链接域名通过白名单检查；活动是否真实、有效及直达报名页尚未确认"
              className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-amber-300"
            >
              <span>域名已检查</span>
            </span>
          </div>

          {/* Activity Title */}
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight group-hover:text-[#4ca6e1] transition-colors line-clamp-2">
            {displayTitle}
          </h3>

          {/* Secondary Details: Date Range + Verification */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#949494]">
            <div className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#949494]" />
              <span>{dateRangeText}</span>
            </div>
            <span className="text-[#333333]">·</span>
            <span className="text-[11px] font-mono">
              核验于 {formattedVerifiedTime}
            </span>
          </div>
        </div>

        {/* Right section: Reward metric & Action Buttons */}
        <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1c1c1c] flex-shrink-0">
          <div className="text-left lg:text-right">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#949494]">
              {rewardMetricLabel}
            </div>
            <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-white group-hover:text-[#4ca6e1] transition-colors">
              {activity.rewardDisplay}
            </div>
            {activity.rewardAmount && (
              <div className="text-[10px] font-mono text-[#949494]">
                {activity.rewardCurrency}
              </div>
            )}
          </div>

          {/* Copy Share Button */}
          <button
            type="button"
            aria-label="复制活动速览"
            title="复制活动信息"
            onClick={handleShare}
            className="p-2 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2b2b2b] text-[#949494] hover:text-white transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <div className="w-8 h-8 rounded bg-[#1a1a1a] group-hover:bg-[#252525] border border-[#2b2b2b] flex items-center justify-center text-[#949494] group-hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
