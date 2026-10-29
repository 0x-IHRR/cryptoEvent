import { Activity, ActivityStatus, ExchangeId, HorizonDay } from '../types/activity.js';

/**
 * Whitelist of official domains for connected exchanges and protocols.
 * Prevents phishing links and validates official destinations.
 */
export const OFFICIAL_EXCHANGE_DOMAINS: Record<ExchangeId, string[]> = {
  Binance: ['binance.com'],
  OKX: ['okx.com'],
  Bitget: ['bitget.com'],
  Bybit: ['bybit.com'],
  Gate: ['gate.io'],
  HTX: ['htx.com'],
  MEXC: ['mexc.com'],
  KuCoin: ['kucoin.com'],
  Paradex: ['paradex.trade'],
  Aster: ['asterdex.com'],
  Lighter: ['lighter.xyz'],
  Merkl: [
    'merkl.xyz',
    'app.uniswap.org',
    'pancakeswap.finance',
    'app.aave.com',
    'app.morpho.org',
    'app.compound.finance',
    'app.spark.fi',
    'curve.fi',
    'balancer.fi',
    'aerodrome.finance',
    'app.aerodrome.finance',
    'venus.io',
    'app.venus.io',
  ],
};

/**
 * Validates whether a given URL belongs to the official exchange whitelist.
 * Blocks javascript:, file:, data:, non-whitelisted domains, and path trickery.
 */
export function isValidOfficialUrl(url: string, exchange: ExchangeId): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const allowed = OFFICIAL_EXCHANGE_DOMAINS[exchange] || [];
    return allowed.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Normalizes official activity URL for deduplication.
 * Removes tracking parameters (utm_*, ref, affiliate codes, session tokens) and trailing slashes.
 */
export function normalizeOfficialUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    // Remove typical referral / analytics query parameters
    const paramsToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (
        lower.startsWith('utm_') ||
        lower.startsWith('ref') ||
        lower === 'channel' ||
        lower === 'invitecode' ||
        lower === 'from' ||
        lower === 'spm'
      ) {
        paramsToDelete.push(key);
      }
    });
    for (const key of paramsToDelete) {
      parsed.searchParams.delete(key);
    }
    parsed.hash = ''; // remove anchor fragment
    let clean = parsed.toString();
    if (clean.endsWith('/') && parsed.pathname !== '/') {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Calculates activity status based on current time.
 * - 'ended': endsAt <= now
 * - 'upcoming': startsAt > now
 * - 'endingSoon': strictly endsAt - now <= 72 * 3600 * 1000 and endsAt > now
 * - 'open': currently active and > 72 hours remaining
 * - 'unknown': invalid timestamps
 */
export function calculateActivityStatus(
  startsAt: string,
  endsAt: string,
  now: Date = new Date()
): ActivityStatus {
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();
  const nowMs = now.getTime();

  if (Number.isNaN(startMs)) {
    return 'unknown';
  }

  if (!endsAt) return startMs > nowMs ? 'upcoming' : 'open';
  if (Number.isNaN(endMs)) return 'unknown';

  if (endMs <= nowMs) {
    return 'ended';
  }

  if (startMs > nowMs) {
    return 'upcoming';
  }

  const diffMs = endMs - nowMs;
  const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

  if (diffMs > 0 && diffMs <= SEVENTY_TWO_HOURS_MS) {
    return 'endingSoon';
  }

  return 'open';
}

/**
 * Checks if activity is ending within 72 hours.
 */
export function isEndingSoon(endsAt: string, now: Date = new Date()): boolean {
  const endMs = new Date(endsAt).getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(endMs)) return false;
  const diffMs = endMs - nowMs;
  return diffMs > 0 && diffMs <= 72 * 3600 * 1000;
}

/**
 * Calculate completeness score (0-100) for activity data fields.
 */
export function calculateCompleteness(act: Partial<Activity>): number {
  let score = 0;
  if (act.title && act.title.trim().length > 3) score += 20;
  if (act.startsAt && !Number.isNaN(new Date(act.startsAt).getTime())) score += 15;
  if (act.endsAt && !Number.isNaN(new Date(act.endsAt).getTime())) score += 15;
  if (act.rewardDisplay && act.rewardDisplay.trim().length > 0) score += 20;
  if (act.requirements && act.requirements.length > 0) score += 15;
  if (act.regionNote && act.regionNote.trim().length > 0) score += 5;
  if (act.officialUrl && act.officialUrl.startsWith('http')) score += 10;
  return Math.min(100, score);
}

export function getRewardMetricLabel(activity: Activity): string {
  const currency = (activity.rewardCurrency || '').toUpperCase();
  if (currency === 'APY') return '当前 APY';
  if (currency === 'XP' || currency === 'POINTS') return '积分奖励';
  if (currency || activity.rewardAmount !== null) return '奖池 / 奖励数量';
  return '奖池信息';
}

/**
 * Deduplicates and merges scraped activities with manual fallback/override entries.
 * De-duplicates by `exchange + normalizeOfficialUrl(officialUrl)`.
 * Manual entries override missing dates, rewards, or requirements on matched items.
 * Non-scraped manual entries are appended as pure manual entries.
 */
export function deduplicateAndMergeActivities(
  scrapedActivities: Activity[],
  manualActivities: Activity[],
  now: Date = new Date()
): Activity[] {
  const map = new Map<string, Activity>();

  // 1. Process scraped items first
  for (const item of scrapedActivities) {
    const normUrl = normalizeOfficialUrl(item.officialUrl);
    const key = `${item.exchange}:::${normUrl}`;

    // Ensure status is recalculated with reference time
    const updatedStatus = item.sourceMode === 'scraper' && item.status !== 'unknown' && (!item.startsAt || !item.endsAt)
      ? item.status
      : calculateActivityStatus(item.startsAt, item.endsAt, now);
    const completeness = calculateCompleteness(item);

    map.set(key, {
      ...item,
      officialUrl: normUrl || item.officialUrl,
      status: updatedStatus,
      completeness,
    });
  }

  // 2. Process manual entries: override or add
  for (const manual of manualActivities) {
    const normUrl = normalizeOfficialUrl(manual.officialUrl);
    const key = `${manual.exchange}:::${normUrl}`;
    const existing = map.get(key);

    if (existing) {
      // Merge: manual overrides missing, placeholder or incomplete fields
      const mergedTitle = manual.title || existing.title;
      const mergedStartsAt = existing.startsAt || manual.startsAt;
      const mergedEndsAt = existing.endsAt || manual.endsAt;
      
      const hasManualRewardNumber = typeof manual.rewardAmount === 'number' && !Number.isNaN(manual.rewardAmount);
      const hasExistingRewardNumber = typeof existing.rewardAmount === 'number' && !Number.isNaN(existing.rewardAmount);

      const mergedRewardAmount = hasManualRewardNumber
        ? manual.rewardAmount
        : hasExistingRewardNumber
        ? existing.rewardAmount
        : null;

      const mergedRewardCurrency = manual.rewardCurrency || existing.rewardCurrency || 'USDT';

      const mergedRewardDisplay = hasManualRewardNumber
        ? (manual.rewardDisplay || existing.rewardDisplay)
        : (existing.rewardDisplay || manual.rewardDisplay);

      const mergedRequirements =
        manual.requirements && manual.requirements.length > 0
          ? manual.requirements
          : (existing.requirements && existing.requirements.length > 0 ? existing.requirements : []);
      const mergedRegion = existing.regionNote || manual.regionNote;

      const updatedStatus = calculateActivityStatus(mergedStartsAt, mergedEndsAt, now);

      const mergedItem: Activity = {
        ...existing,
        title: mergedTitle,
        startsAt: mergedStartsAt,
        endsAt: mergedEndsAt,
        rewardAmount: mergedRewardAmount,
        rewardCurrency: mergedRewardCurrency,
        rewardDisplay: mergedRewardDisplay,
        requirements: mergedRequirements,
        regionNote: mergedRegion,
        kycRequired: manual.kycRequired !== undefined ? manual.kycRequired : existing.kycRequired,
        verifiedAt: manual.verifiedAt || existing.verifiedAt,
        status: updatedStatus,
      };
      mergedItem.completeness = calculateCompleteness(mergedItem);
      map.set(key, mergedItem);
    } else {
      // Add purely manual entry
      const status = calculateActivityStatus(manual.startsAt, manual.endsAt, now);
      const completeness = calculateCompleteness(manual);
      map.set(key, {
        ...manual,
        officialUrl: normUrl || manual.officialUrl,
        sourceMode: 'manual',
        status,
        completeness,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Reward sorting rule:
 * USD, USDT, USDC are considered 1:1 comparable stablecoins and directly sorted by rewardAmount descending.
 * Other tokens (BTC, ETH, TON, points) retain original amount and are placed AFTER comparable stablecoins.
 * Activities without numeric rewardAmount are placed at the end.
 */
export function sortActivities(
  activities: Activity[],
  sortBy: 'newest' | 'endingSoon' | 'rewardScale'
): Activity[] {
  const list = [...activities];

  if (sortBy === 'newest') {
    return list.sort((a, b) => {
      const pubA = new Date(a.publishedAt || a.startsAt).getTime() || 0;
      const pubB = new Date(b.publishedAt || b.startsAt).getTime() || 0;
      return pubB - pubA;
    });
  }

  if (sortBy === 'endingSoon') {
    return list.sort((a, b) => {
      // Priority 1: endingSoon first, then open, then upcoming, then ended
      const priorityOrder: Record<ActivityStatus, number> = {
        endingSoon: 1,
        open: 2,
        upcoming: 3,
        unknown: 4,
        ended: 5,
      };
      const pDiff = (priorityOrder[a.status] || 99) - (priorityOrder[b.status] || 99);
      if (pDiff !== 0) return pDiff;

      // Priority 2: among endingSoon or open, sort by endsAt ascending
      const endA = new Date(a.endsAt).getTime() || Number.MAX_SAFE_INTEGER;
      const endB = new Date(b.endsAt).getTime() || Number.MAX_SAFE_INTEGER;
      return endA - endB;
    });
  }

  if (sortBy === 'rewardScale') {
    const isStable = (curr: string) => {
      const c = (curr || '').toUpperCase();
      return c === 'USDT' || c === 'USD' || c === 'USDC';
    };

    return list.sort((a, b) => {
      const aHasAmt = typeof a.rewardAmount === 'number' && !Number.isNaN(a.rewardAmount);
      const bHasAmt = typeof b.rewardAmount === 'number' && !Number.isNaN(b.rewardAmount);

      if (!aHasAmt && !bHasAmt) return 0;
      if (!aHasAmt) return 1;
      if (!bHasAmt) return -1;

      const aStable = isStable(a.rewardCurrency);
      const bStable = isStable(b.rewardCurrency);

      // Stablecoins come first
      if (aStable && !bStable) return -1;
      if (!aStable && bStable) return 1;

      // Both stable or both non-stable: sort by amount descending
      return (b.rewardAmount || 0) - (a.rewardAmount || 0);
    });
  }

  return list;
}

/**
 * Computes 7-Day Ending Horizon (七日截止带).
 * Calculates activity counts ending on each of the upcoming 7 calendar days (D+0 to D+6).
 */
export function computeSevenDayHorizon(
  activities: Activity[],
  referenceDate: Date = new Date()
): HorizonDay[] {
  const result: HorizonDay[] = [];
  const refTime = referenceDate.getTime();

  // Generate 7 days starting from reference date
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(refTime + i * 24 * 60 * 60 * 1000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdayLabel = weekdayNames[targetDate.getDay()];

    let dayLabel = `${mm}/${dd}`;
    if (i === 0) dayLabel = '今天';
    else if (i === 1) dayLabel = '明天';
    else if (i === 2) dayLabel = '后天';

    // Find activities ending on this day that are not already ended prior to refTime
    const matchingIds: string[] = [];
    for (const act of activities) {
      if (!act.endsAt) continue;
      const endMs = new Date(act.endsAt).getTime();
      if (Number.isNaN(endMs)) continue;
      if (endMs < refTime) continue; // Skip past ended

      const actEndDate = new Date(act.endsAt);
      const actDateStr = `${actEndDate.getFullYear()}-${String(actEndDate.getMonth() + 1).padStart(2, '0')}-${String(actEndDate.getDate()).padStart(2, '0')}`;

      if (actDateStr === dateStr) {
        matchingIds.push(act.id);
      }
    }

    result.push({
      dateStr,
      dayLabel,
      weekdayLabel,
      count: matchingIds.length,
      activityIds: matchingIds,
      isToday: i === 0,
      isUrgent: i <= 2, // Next 3 days are within 72h window
    });
  }

  return result;
}

/**
 * Formats countdown or remaining time string in Chinese.
 */
export function formatTimeRemaining(endsAt: string, now: Date = new Date()): string {
  if (!endsAt) return '截止时间待公布';
  const endMs = new Date(endsAt).getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(endMs)) return '时间待定';

  const diff = endMs - nowMs;
  if (diff <= 0) return '已截止';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 3) {
    return `剩余 ${days} 天`;
  }
  if (days >= 1) {
    const remainHours = hours % 24;
    return `剩 ${days} 天 ${remainHours} 小时`;
  }
  if (hours > 0) {
    return `剩 ${hours} 小时 ${minutes} 分`;
  }
  return `仅剩 ${minutes} 分钟`;
}

/**
 * Formats date range in standard compact format (e.g. "10/28 12:00 - 11/04 23:59")
 */
export function formatDateRange(startsAt: string, endsAt: string): string {
  const formatSingle = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '-';
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${m}/${day} ${hh}:${mm}`;
    } catch {
      return '-';
    }
  };

  const start = startsAt ? formatSingle(startsAt) : '开始时间待公布';
  const end = endsAt ? formatSingle(endsAt) : '截止时间待公布';
  return `${start} ~ ${end}`;
}

/**
 * Format a Date to iCal UTC format (YYYYMMDDTHHMMSSZ).
 */
function toIcsDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) {
      const fallback = new Date();
      return fallback.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

/**
 * Generates an RFC-5545 standard .ics calendar string with early alarm notification.
 */
export function generateIcsContent(activity: Activity): string {
  const dtStamp = toIcsDate(new Date().toISOString());
  const dtStart = toIcsDate(activity.startsAt || new Date().toISOString());
  const dtEnd = toIcsDate(activity.endsAt || new Date().toISOString());

  const summary = `[${activity.exchange}] ${activity.title}`.replace(/[,;]/g, ' ');
  const description = [
    `交易所: ${activity.exchange}`,
    `活动分类: ${activity.category}`,
    `${getRewardMetricLabel(activity)}: ${activity.rewardDisplay}`,
    activity.requirements?.length ? `规则门槛: ${activity.requirements.join('; ')}` : '',
    `官方活动链接: ${activity.officialUrl}`,
  ]
    .filter(Boolean)
    .join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ExchangeActivityRadar//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${activity.id}-${Date.now()}@activity-radar`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `URL:${activity.officialUrl}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:【截止预警】${summary} 仅剩 2 小时截止，请及时确认参与或平仓`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Formats a clean, readable text snippet for sharing to Telegram, WeChat, or X/Twitter.
 */
export function generateActivityShareText(activity: Activity): string {
  const timeRemaining = formatTimeRemaining(activity.endsAt);
  const dateRange = formatDateRange(activity.startsAt, activity.endsAt);
  const reqSummary =
    activity.requirements && activity.requirements.length > 0
      ? activity.requirements.slice(0, 2).join('；')
      : '以官方公示条款为准';

  return [
    `【${activity.exchange} · ${activity.category}】${activity.title}`,
    `💰 ${getRewardMetricLabel(activity)}: ${activity.rewardDisplay}`,
    `⏳ 截止状态: ${timeRemaining} (${dateRange})`,
    `📋 参与门槛: ${reqSummary}`,
    `🛡️ 官方直达: ${activity.officialUrl}`,
    `-- 来源: 交易所活动榜 (Activity Radar)`,
  ].join('\n');
}

export function generateActivityResearchPrompt(activity: Activity): string {
  const platform = activity.protocolName || activity.exchange;
  const kycText =
    activity.kycRequired === true
      ? '需要完成 KYC 实名认证'
      : activity.kycRequired === false
      ? '免 KYC / 支持去中心化钱包参与'
      : '未明确标注（需在官方页面确认）';

  const requirementsText =
    activity.requirements && activity.requirements.length > 0
      ? activity.requirements.map((req, idx) => `  ${idx + 1}. ${req}`).join('\n')
      : '  （官方暂未拆解细则，请结合官方规则链接查阅）';

  const parts = [
    `# 任务目标：分析【${platform}】活动规则并制定最佳参与策略`,
    '',
    '请扮演一名资深的加密货币市场与链上活动研究专家。我已经整理了该活动的全部已知公开信息与官方直达链接。请深入研究这些规则与玩法机制，并为我输出一份高可行性、注重资金安全与资金效率的参与策略指南。',
    '',
    '## 一、活动基本信息与已采集数据',
    `- 举办平台 / 协议：${platform}${activity.exchange && activity.exchange !== platform ? `（数据源：${activity.exchange}）` : ''}`,
    `- 活动标题：${activity.title}`,
    `- 活动分类：${activity.category}`,
    activity.chainName ? `- 所在区块链 / 网络：${activity.chainName}` : null,
    `- 官方奖池 / 奖励说明：${activity.rewardDisplay}${activity.rewardCurrency ? ` (${activity.rewardCurrency})` : ''}`,
    `- 活动开始时间：${activity.startsAt || '未注明'}`,
    `- 活动截止时间：${activity.endsAt || '进行中 / 未注明固定截止日期'}`,
    `- 当前状态：${activity.status === 'endingSoon' ? '72小时内即将截止 (急迫)' : activity.status === 'open' ? '进行中' : activity.status === 'upcoming' ? '即将开始' : '已结束'}`,
    `- KYC 要求：${kycText}`,
    activity.regionNote ? `- 地区与合规说明：${activity.regionNote}` : null,
    `- 参与门槛与已知要点：\n${requirementsText}`,
    activity.description ? `- 官方活动简介 / 原文：\n  ${activity.description.replace(/\n+/g, ' ')}` : null,
    '',
    '## 二、官方直达链接与参考页面',
    `- 官方活动 / 规则链接：${activity.officialUrl}`,
    activity.sourceUrl && activity.sourceUrl !== activity.officialUrl ? `- 数据来源页面：${activity.sourceUrl}` : null,
    '',
    '## 三、请重点分析并输出以下策略内容',
    '1. 【规则与玩法机制拆解】：',
    '   - 梳理该活动的核心分配逻辑（如阶梯排名、质押权重快照、交易量门槛、LP 做市手续费分成或任务空投等）。',
    '   - 明确关键判定时间节点（快照频次、统计周期、奖励发放与锁定期）。',
    '2. 【最优参与策略与路径】：',
    '   - 根据规则设计最优参与路径。如何以最低资金磨损（如低费率交易对、Maker 挂单、借贷对冲或低 Gas 交互窗口）达到最高收益档位？',
    '   - 资金体量策略：分别针对小资金（追求高确定性/稳妥达标）与中大资金（追求绝对收益/排名边际）给出资金配置建议。',
    '3. 【潜在风险与摩擦防守】：',
    '   - 明确指出可能遇到的磨损点（手续费、滑点、借币利息、反向价格波动、出界无常损失等）以及具体的应对/对冲措施。',
    '   - 计算边际收益临界点：提示哪些操作在成本上是不划算的。',
    '4. 【步骤化实操执行清单】：',
    '   - 步骤 1：准备阶段（账户、KYC、资金与网络环境准备）',
    '   - 步骤 2：操作执行（具体交互或对冲流程）',
    '   - 步骤 3：收益锁定与本金退出（何时赎回、结算及兑现）',
  ].filter((line) => line !== null);

  return parts.join('\n');
}
