import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Globe2,
  Lock,
  CalendarPlus,
  Share2,
  Check,
  Star,
} from 'lucide-react';
import { Activity } from '../types/activity.js';
import {
  formatTimeRemaining,
  formatDateRange,
  isValidOfficialUrl,
  generateIcsContent,
  generateActivityShareText,
  getRewardMetricLabel,
} from '../utils/activity.js';
import { ArbitrageCalculators } from './ArbitrageCalculators.js';
import { getChineseActivityDescription, getChineseActivityTitle } from '../utils/activity-localization.js';

interface ActivityDetailDrawerProps {
  activity: Activity | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const ActivityDetailDrawer: React.FC<ActivityDetailDrawerProps> = ({
  activity,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadedIcs, setDownloadedIcs] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{
    status: string;
    httpStatus: number;
    latencyMs: number;
    statusLabel: string;
  } | null>(null);
  const [isProbing, setIsProbing] = useState<boolean>(false);

  useEffect(() => {
    if (!activity) return;
    setProbeResult(null);
  }, [activity]);

  const handleProbeLive = async () => {
    if (!activity) return;
    setIsProbing(true);
    try {
      const res = await fetch(
        `/api/validate-url?url=${encodeURIComponent(activity.officialUrl)}&exchange=${activity.exchange}`
      );
      if (res.ok) {
        const data = await res.json();
        setProbeResult(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsProbing(false);
    }
  };

  // Keyboard navigation: Esc to close & focus management
  useEffect(() => {
    if (!activity) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activity, onClose]);

  if (!activity) return null;

  const isUrgent = activity.status === 'endingSoon';
  const isUrlWhitelisted = isValidOfficialUrl(activity.officialUrl, activity.exchange);
  const timeRemaining = formatTimeRemaining(activity.endsAt);
  const dateRange = formatDateRange(activity.startsAt, activity.endsAt);
  const chineseTitle = getChineseActivityTitle(activity);
  const chineseDescription = getChineseActivityDescription(activity);
  const rewardMetricLabel = getRewardMetricLabel(activity);

  const handleDownloadIcs = () => {
    const icsContent = generateIcsContent(activity);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activity.exchange}-${activity.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedIcs(true);
    setTimeout(() => setDownloadedIcs(false), 2500);
  };

  const handleCopyShare = () => {
    const text = generateActivityShareText(activity);
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-xl h-full bg-[#111111] border-l border-[#262626] shadow-2xl flex flex-col z-10 text-[#f3f4f6]"
      >
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-[#222222] flex items-center justify-between flex-shrink-0 bg-[#0e0e0e]">
          <div className="flex items-center gap-2.5">
            {/* Star button */}
            <button
              type="button"
              aria-label={isFavorite ? '取消关注' : '加入关注'}
              onClick={() => onToggleFavorite(activity.id)}
              className="p-1 rounded text-[#949494] hover:text-amber-400 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>

            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#1e1e1e] border border-[#333333] text-white">
              {activity.protocolName || activity.exchange}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#181818] text-[#949494] border border-[#262626]">
              {activity.category}
            </span>
            {isUrgent && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#2a1d0d] text-amber-300 border border-[#523814]">
                72h急迫
              </span>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="关闭活动详情 (Esc)"
            className="p-2 rounded text-[#949494] hover:text-white hover:bg-[#1f1f1f] transition-colors focus:outline-none focus:ring-1 focus:ring-[#4ca6e1]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Overview */}
          <div>
            <h2
              id="activity-drawer-title"
              className="text-lg font-bold text-white tracking-tight leading-snug"
            >
              {chineseTitle || activity.title}
            </h2>
            {chineseTitle && (
              <p className="mt-1 text-[11px] text-[#949494]">活动原文：{activity.title}</p>
            )}
            {activity.description && (
              chineseDescription ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">{chineseDescription}</p>
                  <details className="text-[11px] text-[#949494]">
                    <summary className="cursor-pointer hover:text-white">查看官方来源原文</summary>
                    <p className="mt-2 leading-relaxed">{activity.description}</p>
                  </details>
                </div>
              ) : activity.exchange === 'Merkl' ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    本活动来自 {activity.protocolName}，部署在 {activity.chainName || '未注明的区块链'}，类别为“{activity.category}”。来源暂未提供完整中文规则，请查看官方原文或复制研究 Prompt 获取逐条翻译。
                  </p>
                  <details className="text-[11px] text-[#949494]">
                    <summary className="cursor-pointer hover:text-white">查看官方来源原文</summary>
                    <p className="mt-2 leading-relaxed">{activity.description}</p>
                  </details>
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#a3a3a3] leading-relaxed">{activity.description}</p>
              )
            )}
          </div>

          {/* Reward & Countdown Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded bg-[#161616] border border-[#242424]">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#949494]">
                {rewardMetricLabel}
              </div>
              <div className="text-lg font-bold font-mono text-[#4ca6e1] mt-1">
                {activity.rewardDisplay}
              </div>
              <div className="text-[10px] text-[#949494] mt-0.5">
                {activity.rewardAmount !== null ? `奖励币种：${activity.rewardCurrency}` : ''}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#161616] border border-[#242424]">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#949494]">
                截止倒计时
              </div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  isUrgent ? 'text-amber-300' : 'text-white'
                }`}
              >
                {timeRemaining}
              </div>
              <div className="text-[10px] font-mono text-[#949494] mt-0.5">
                {dateRange}
              </div>
            </div>
          </div>

          {/* Participation Requirements */}
          <div className="p-4 rounded bg-[#141414] border border-[#222222] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#4ca6e1]" />
                参与门槛与规则要点
              </span>
              <span className="text-[10px] font-mono text-[#949494]">
                {activity.requirements?.length || 0} 项要求
              </span>
            </div>

            {activity.requirements && activity.requirements.length > 0 ? (
              <ul className="space-y-2 text-xs text-[#d1d5db]">
                {activity.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#1e2e38] text-[#4ca6e1] font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#949494]">
                规则请以官方页面最终公示条款为准。
              </p>
            )}
          </div>

          {/* Arbitrage Strategy & Marginal ROI Calculators */}
          <ArbitrageCalculators activity={activity} />

          {/* Compliance & Region Restrictions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#141414] border border-[#222222] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#d1d5db]">
                <Lock className="w-3.5 h-3.5 text-[#949494]" />
                <span>KYC 身份认证</span>
              </div>
              <p className="text-xs text-[#949494]">
                {activity.kycRequired === true ? (
                  <span className="text-amber-300/90 font-mono">必须完成实名认证</span>
                ) : activity.kycRequired === false ? (
                  <span className="text-emerald-400 font-mono">免实名 / 去中心化钱包可用</span>
                ) : (
                  <span className="text-amber-300 font-mono">未从来源信息核实</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded bg-[#141414] border border-[#222222] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#d1d5db]">
                <Globe2 className="w-3.5 h-3.5 text-[#949494]" />
                <span>地区与管辖限制</span>
              </div>
              <p className="text-xs text-[#949494] line-clamp-2">
                {activity.regionNote || '遵循官方地区合规政策'}
              </p>
            </div>
          </div>

          {/* Official Domain Whitelist & Real-time Cross-Validation Shield */}
          <div className="p-3.5 rounded bg-[#101b24] border border-[#1b3447] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#4ca6e1] font-medium">
                <ShieldCheck className="w-4 h-4 text-[#4ca6e1]" />
                <span>活动来源链接检查</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleProbeLive}
                  disabled={isProbing}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#162736] hover:bg-[#1e3447] text-[#4ca6e1] border border-[#23455f] transition-colors"
                >
                  {isProbing ? '探测中...' : '重新探测连通性'}
                </button>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800">
                  仅校验域名
                </span>
              </div>
            </div>

            <div className="text-xs text-[#a3a3a3] leading-relaxed flex items-center justify-between">
              <span>{probeResult?.statusLabel || '尚未检查链接响应；域名白名单不证明活动真实或仍有效'}</span>
              {probeResult?.latencyMs && (
                <span className="font-mono text-[10px] text-emerald-400">
                  延迟 {probeResult.latencyMs}ms
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 bg-[#0a1219] p-2 rounded border border-[#142838]">
              <span className="text-[11px] font-mono text-[#4ca6e1] break-all truncate">
                {activity.officialUrl}
              </span>
              <a
                href={activity.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#162b3b] hover:bg-[#1f3c52] text-[#4ca6e1] flex-shrink-0 transition-colors"
              >
                <span>{activity.officialUrlKind === 'listing' ? '打开官方活动列表' : '打开官方活动页面'}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Data Completeness Bar & Verification Source */}
          <div className="p-3 rounded bg-[#141414] border border-[#222222] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#949494]">数据完整度指数</span>
              <span className="font-mono text-white font-semibold">
                {activity.completeness ?? 0}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden">
              <div
                className="h-full bg-[#4ca6e1]"
                style={{ width: `${activity.completeness ?? 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#949494] pt-1 font-mono">
              <span>采集方式: {activity.sourceMode === 'manual' ? '人工录入' : activity.exchange === 'Merkl' ? 'Merkl 官方奖励 API' : ['Paradex', 'Aster', 'Lighter'].includes(activity.exchange) ? '官方文档监控' : ['OKX', 'Binance', 'Gate', 'HTX', 'MEXC'].includes(activity.exchange) ? '官方活动页数据' : '官方公告 API'}</span>
              {activity.chainName && <span>链: {activity.chainName}</span>}
              <span>最后核验: {activity.verifiedAt ? activity.verifiedAt.slice(0, 16).replace('T', ' ') : '未核验'}</span>
            </div>
            {activity.evidenceText && (
              <p className="text-[11px] text-[#a3a3a3] leading-relaxed border-t border-[#222222] pt-2">
                来源证据：{activity.evidenceText}
              </p>
            )}
            {activity.sourceUrl && activity.sourceUrl !== activity.officialUrl && (
              <a href={activity.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#4ca6e1] hover:underline">
                查看采集源说明 <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer with Safe Direct Link, Calendar Export, and Share */}
        <div className="p-4 bg-[#0e0e0e] border-t border-[#222222] flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Export to System Calendar (.ics) */}
            <button
              type="button"
              onClick={handleDownloadIcs}
              title="导出 RFC-5545 .ics 日历文件，自动设置截止前 2 小时提醒"
              className="flex items-center gap-1.5 h-9 px-3 rounded bg-[#1a1a1a] hover:bg-[#242424] active:bg-[#1f1f1f] border border-[#2e2e2e] text-xs font-medium text-[#d1d5db] hover:text-white transition-colors"
            >
              {downloadedIcs ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>已导出日历</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="w-3.5 h-3.5 text-[#4ca6e1]" />
                  <span>加到日历 (.ics)</span>
                </>
              )}
            </button>

            {/* Quick Share Copy */}
            <button
              type="button"
              onClick={handleCopyShare}
              title="复制结构化活动摘要"
              className="flex items-center gap-1.5 h-9 px-3 rounded bg-[#1a1a1a] hover:bg-[#242424] border border-[#2e2e2e] text-xs font-medium text-[#d1d5db] hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#949494]" />
                  <span>复制速报</span>
                </>
              )}
            </button>
          </div>

          <a
            href={activity.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-9 px-5 rounded bg-[#4ca6e1] hover:bg-[#3d91c7] active:bg-[#347fae] text-black font-semibold text-xs tracking-wide transition-colors"
          >
            <span>{activity.officialUrlKind === 'listing' ? '打开官方活动列表' : '打开活动来源链接'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
