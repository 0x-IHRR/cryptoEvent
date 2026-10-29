export type CexId =
  | 'Binance'
  | 'OKX'
  | 'Bitget'
  | 'Bybit'
  | 'Gate'
  | 'HTX'
  | 'MEXC'
  | 'KuCoin';

export type ExchangeId = CexId | 'Paradex' | 'Aster' | 'Lighter' | 'Merkl';

export type ActivityStatus = 'upcoming' | 'open' | 'endingSoon' | 'ended' | 'unknown';

export type SourceMode = 'scraper' | 'manual';

export type ActivityCategory =
  | '交易竞赛'
  | 'Launchpool'
  | '新币空投'
  | '充值质押'
  | '合约狂欢'
  | '理财加息'
  | '钱包活动'
  | 'Perp DEX 激励'
  | '链上流动性激励'
  | '借贷激励'
  | '链上协议激励'
  | '任务礼包'
  | '其他';

export interface Activity {
  id: string;
  exchange: ExchangeId;
  protocolName?: string;
  chainName?: string;
  title: string;
  category: string;
  rewardAmount: number | null;
  rewardCurrency: string;
  rewardDisplay: string;
  publishedAt: string; // ISO
  startsAt: string;    // ISO
  endsAt: string;      // ISO
  requirements: string[];
  kycRequired?: boolean;
  regionNote: string;
  officialUrl: string;
  sourceMode: SourceMode;
  verifiedAt: string;  // ISO
  status: ActivityStatus;
  description?: string;
  tags?: string[];
  completeness?: number; // 0 - 100
  sourceUrl?: string;
  evidenceText?: string;
  verificationState?: 'official-source' | 'manual-review-required';
  officialUrlKind?: 'activity' | 'listing';
}

export interface SourceHealth {
  exchange: ExchangeId;
  displayName: string;
  method: '官方公开 API' | '官方活动页接口' | '官方奖励 API' | '官方文档监控' | '人工补录' | '未接入活动解析';
  mode: SourceMode;
  status: 'operational' | 'degraded' | 'fallback_active' | 'error';
  httpStatus: number;
  activityCount: number;
  lastScrapedAt: string;
  lastSuccessAt: string;
  parserType: string;
  note: string;
  officialDomain: string;
  sourceUrl?: string;
}

export interface HorizonDay {
  dateStr: string;     // YYYY-MM-DD
  dayLabel: string;    // '今天', '明天', 'D+2', etc.
  weekdayLabel: string;// '周三', '周四', etc.
  count: number;
  activityIds: string[];
  isToday: boolean;
  isUrgent: boolean;   // within 72h
}

export interface ActivitiesApiResponse {
  updatedAt: string;
  total: number;
  stats: {
    openCount: number;
    endingSoonCount: number;
    upcomingCount: number;
    totalRewardUsdValue: number;
  };
  activities: Activity[];
}

export interface SourcesApiResponse {
  updatedAt: string;
  sources: SourceHealth[];
}
