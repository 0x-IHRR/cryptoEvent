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
  const evidence = {
    id: activity.id,
    platform: activity.protocolName || activity.exchange,
    dataProvider: activity.exchange,
    chain: activity.chainName || '未提供',
    title: activity.title,
    category: activity.category,
    description: activity.description || '未提供',
    reward: activity.rewardDisplay,
    rewardToken: activity.rewardCurrency || '未提供',
    startTime: activity.startsAt || '未提供',
    endTime: activity.endsAt || '未提供',
    status: activity.status,
    requirements: activity.requirements,
    kyc: activity.kycRequired === undefined ? '未核实' : activity.kycRequired ? '来源记录为需要 KYC' : '来源记录为不需要 KYC',
    regionNote: activity.regionNote,
    officialActivityUrl: activity.officialUrl,
    collectionSourceUrl: activity.sourceUrl || '未提供',
    sourceEvidence: activity.evidenceText || '未提供',
    sourceMode: activity.sourceMode,
    verificationState: activity.verificationState || '未标注',
    lastVerifiedAt: activity.verifiedAt || '未提供',
    dataCompleteness: `${activity.completeness ?? 0}%`,
  };

  return `请用简体中文研究下面这条活动，并生成一份可核验的参与攻略。\n\n研究要求：\n1. 先打开“官方活动页面”，阅读完整活动规则；再查看“采集来源页面”提供的背景信息。若链接打不开或页面没有明确规则，说明无法核实的部分，不要猜测。\n2. 将活动标题、规则、门槛、奖励说明翻译成中文；协议名、代币符号、合约术语可保留英文，并附上关键原文。\n3. 把结论分为“官方页面明确说明”“根据页面信息推断”“仍待核实”。重要规则附原文短引、所在页面链接和页面更新时间。\n4. 说明适用链、参与步骤、奖励计算方式、截止时间、KYC 与地区限制、最低金额、快照或持仓要求、退出/领取规则。页面没有说明的字段明确写“未披露”。\n5. 评估 Gas、交易费、滑点、借贷成本、无常损失、清算、奖励币价格与资格风险。只有证据足够时才计算成本或收益；不得把动态 APR 当成保证收益，也不得把活动直接称为无风险套利。\n6. 给出参加前核对清单和停止参与条件。不要执行交易、连接钱包或要求用户提供私钥、助记词、Cookie、API 密钥。\n\n活动记录（未经翻译的来源数据）：\n${JSON.stringify(evidence, null, 2)}\n\n请先核实链接内容，再给出中文攻略。不得把这份采集记录本身当作规则已经核实的证明。`;
}
