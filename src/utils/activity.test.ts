import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateActivityStatus,
  isEndingSoon,
  isValidOfficialUrl,
  normalizeOfficialUrl,
  deduplicateAndMergeActivities,
  sortActivities,
  computeSevenDayHorizon,
} from './activity.js';
import { Activity } from '../types/activity.js';

test('Activity Status: 72-hour boundary test', () => {
  const refTime = new Date('2026-10-28T12:00:00Z');

  // Case 1: 71 hours and 59 minutes remaining -> strictly endingSoon
  const endsAt71h = new Date(refTime.getTime() + (71 * 60 + 59) * 60 * 1000).toISOString();
  const startsAtPast = new Date(refTime.getTime() - 24 * 60 * 60 * 1000).toISOString();
  assert.equal(
    calculateActivityStatus(startsAtPast, endsAt71h, refTime),
    'endingSoon',
    '71h59m remaining should be endingSoon'
  );
  assert.equal(isEndingSoon(endsAt71h, refTime), true);

  // Case 2: Exactly 72 hours remaining -> endingSoon boundary
  const endsAtExact72h = new Date(refTime.getTime() + 72 * 60 * 60 * 1000).toISOString();
  assert.equal(
    calculateActivityStatus(startsAtPast, endsAtExact72h, refTime),
    'endingSoon',
    'Exactly 72h should be endingSoon'
  );
  assert.equal(isEndingSoon(endsAtExact72h, refTime), true);

  // Case 3: 72 hours and 1 minute remaining -> open (not yet urgent)
  const endsAt72h01m = new Date(refTime.getTime() + (72 * 60 + 1) * 60 * 1000).toISOString();
  assert.equal(
    calculateActivityStatus(startsAtPast, endsAt72h01m, refTime),
    'open',
    '72h01m remaining should be open'
  );
  assert.equal(isEndingSoon(endsAt72h01m, refTime), false);

  // Case 4: 0 minutes remaining or past -> ended
  const endsAtNow = refTime.toISOString();
  assert.equal(calculateActivityStatus(startsAtPast, endsAtNow, refTime), 'ended');
  assert.equal(isEndingSoon(endsAtNow, refTime), false);

  // Case 5: 1 hour in past -> ended
  const endsAtPast = new Date(refTime.getTime() - 60 * 60 * 1000).toISOString();
  assert.equal(calculateActivityStatus(startsAtPast, endsAtPast, refTime), 'ended');

  // Case 6: Starts in future -> upcoming
  const startsAtFuture = new Date(refTime.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const endsAtFuture = new Date(refTime.getTime() + 50 * 60 * 60 * 1000).toISOString();
  assert.equal(calculateActivityStatus(startsAtFuture, endsAtFuture, refTime), 'upcoming');
});

test('Security URL Validator: Accepts official exchange domains and rejects malicious links', () => {
  // Official Binance URLs
  assert.equal(
    isValidOfficialUrl('https://www.binance.com/zh-CN/support/announcement/activity1', 'Binance'),
    true
  );
  assert.equal(
    isValidOfficialUrl('https://binance.com/en/trade-competition', 'Binance'),
    true
  );

  // Official OKX URLs
  assert.equal(
    isValidOfficialUrl('https://www.okx.com/campaigns/autumn-fest', 'OKX'),
    true
  );

  // Official Bitget, Bybit, Gate, HTX, MEXC, KuCoin
  assert.equal(isValidOfficialUrl('https://www.bitget.com/events/123', 'Bitget'), true);
  assert.equal(isValidOfficialUrl('https://www.bybit.com/promo/wsot', 'Bybit'), true);
  assert.equal(isValidOfficialUrl('https://www.gate.io/activities/trade-pool', 'Gate'), true);
  assert.equal(isValidOfficialUrl('https://www.htx.com/zh-cn/activity', 'HTX'), true);
  assert.equal(isValidOfficialUrl('https://www.mexc.com/launchpool', 'MEXC'), true);
  assert.equal(isValidOfficialUrl('https://www.kucoin.com/promotions', 'KuCoin'), true);

  // MALICIOUS & PHISHING REJECTIONS
  // 1. Phishing subdomain / spoofing domain
  assert.equal(
    isValidOfficialUrl('https://binance.com.phishing-site.xyz/login', 'Binance'),
    false
  );
  assert.equal(
    isValidOfficialUrl('https://evil-binance.com/scam', 'Binance'),
    false
  );
  assert.equal(
    isValidOfficialUrl('https://fake-okx.com', 'OKX'),
    false
  );

  // 2. Cross-exchange spoofing
  assert.equal(
    isValidOfficialUrl('https://www.okx.com/login', 'Binance'),
    false,
    'OKX link should not validate for Binance'
  );

  // 3. Dangerous protocols
  assert.equal(
    isValidOfficialUrl('javascript:alert(1)', 'Binance'),
    false
  );
  assert.equal(
    isValidOfficialUrl('data:text/html,<script>alert(1)</script>', 'Bitget'),
    false
  );
  assert.equal(
    isValidOfficialUrl('file:///etc/passwd', 'KuCoin'),
    false
  );
});

test('URL Normalization: Strips affiliate, tracking, and trailing slashes for deduplication', () => {
  const dirty1 = 'https://www.binance.com/zh-CN/activity?utm_source=twitter&utm_medium=cpc&ref=12345678#rules';
  const clean1 = normalizeOfficialUrl(dirty1);
  assert.equal(clean1, 'https://www.binance.com/zh-CN/activity');

  const dirty2 = 'https://www.okx.com/campaigns/fest/?channel=affiliate&from=banner';
  const clean2 = normalizeOfficialUrl(dirty2);
  assert.equal(clean2, 'https://www.okx.com/campaigns/fest');
});

test('Deduplication & Manual Override: Merges fields and eliminates duplicates', () => {
  const refTime = new Date('2026-10-28T12:00:00Z');

  const scraped: Activity[] = [
    {
      id: 'binance-raw-1',
      exchange: 'Binance',
      title: '币安合约交易争霸赛',
      category: '交易竞赛',
      rewardAmount: null, // Scraper missed the reward amount
      rewardCurrency: 'USDT',
      rewardDisplay: '海量奖金',
      publishedAt: '2026-10-20T00:00:00Z',
      startsAt: '2026-10-25T00:00:00Z',
      endsAt: '2026-10-30T00:00:00Z',
      requirements: [], // Scraper missed requirements
      kycRequired: false,
      regionNote: '',
      officialUrl: 'https://www.binance.com/zh-CN/activity?utm_source=app',
      sourceMode: 'scraper',
      verifiedAt: '2026-10-28T00:00:00Z',
      status: 'open',
    },
  ];

  const manual: Activity[] = [
    {
      id: 'binance-manual-1',
      exchange: 'Binance',
      title: '币安合约交易争霸赛（终极总奖池）',
      category: '交易竞赛',
      rewardAmount: 2500000,
      rewardCurrency: 'USDT',
      rewardDisplay: '2,500,000 USDT',
      publishedAt: '2026-10-20T00:00:00Z',
      startsAt: '2026-10-25T00:00:00Z',
      endsAt: '2026-10-30T00:00:00Z',
      requirements: ['合约日交易量 ≥ 10,000 USDT', '完成进阶KYC验证'],
      kycRequired: true,
      regionNote: '限制司法管辖区不参与',
      officialUrl: 'https://www.binance.com/zh-CN/activity', // Same normalized URL
      sourceMode: 'manual',
      verifiedAt: '2026-10-28T10:00:00Z',
      status: 'open',
    },
    {
      id: 'gate-manual-1',
      exchange: 'Gate',
      title: 'Gate 全民交易狂欢',
      category: '充值质押',
      rewardAmount: 50000,
      rewardCurrency: 'USDT',
      rewardDisplay: '50,000 USDT',
      publishedAt: '2026-10-26T00:00:00Z',
      startsAt: '2026-10-27T00:00:00Z',
      endsAt: '2026-11-02T00:00:00Z',
      requirements: ['净充值 ≥ 100 USDT'],
      kycRequired: true,
      regionNote: '全球除受限地区',
      officialUrl: 'https://www.gate.io/activities/trade-pool',
      sourceMode: 'manual',
      verifiedAt: '2026-10-28T10:00:00Z',
      status: 'open',
    },
  ];

  const merged = deduplicateAndMergeActivities(scraped, manual, refTime);

  // Must have exactly 2 items (binance deduplicated, gate added)
  assert.equal(merged.length, 2, 'Should deduplicate binance activity into 1 item');

  const binanceItem = merged.find((item) => item.exchange === 'Binance')!;
  assert.ok(binanceItem);
  assert.equal(binanceItem.rewardAmount, 2500000, 'Manual reward amount should override scraped null');
  assert.equal(binanceItem.rewardDisplay, '2,500,000 USDT');
  assert.equal(binanceItem.requirements.length, 2, 'Manual requirements should fill empty scraped list');
  assert.equal(binanceItem.kycRequired, true);
  assert.equal(binanceItem.regionNote, '限制司法管辖区不参与');
});

test('Reward Pool Sorting: USD/USDT/USDC directly compared, non-USD tokens ranked after', () => {
  const dummyBase = {
    publishedAt: '2026-10-20T00:00:00Z',
    startsAt: '2026-10-20T00:00:00Z',
    endsAt: '2026-11-20T00:00:00Z',
    requirements: [],
    kycRequired: true,
    regionNote: '',
    sourceMode: 'scraper' as const,
    verifiedAt: '2026-10-28T00:00:00Z',
    status: 'open' as const,
  };

  const activities: Activity[] = [
    {
      ...dummyBase,
      id: '1',
      exchange: 'KuCoin',
      title: 'Ton Mining',
      category: 'Launchpool',
      rewardAmount: 500000,
      rewardCurrency: 'TON', // Non-USD token, 500k units
      rewardDisplay: '500,000 TON',
      officialUrl: 'https://www.kucoin.com/promotions/ton',
    },
    {
      ...dummyBase,
      id: '2',
      exchange: 'Binance',
      title: 'Small USDT Pool',
      category: '交易竞赛',
      rewardAmount: 20000,
      rewardCurrency: 'USDT', // USD stablecoin 20k
      rewardDisplay: '20,000 USDT',
      officialUrl: 'https://www.binance.com/small',
    },
    {
      ...dummyBase,
      id: '3',
      exchange: 'OKX',
      title: 'Mega USDC Pool',
      category: '交易竞赛',
      rewardAmount: 1000000,
      rewardCurrency: 'USDC', // USD stablecoin 1M
      rewardDisplay: '1,000,000 USDC',
      officialUrl: 'https://www.okx.com/mega',
    },
    {
      ...dummyBase,
      id: '4',
      exchange: 'Bitget',
      title: 'Mid USD Pool',
      category: '充值质押',
      rewardAmount: 200000,
      rewardCurrency: 'USD', // USD stablecoin 200k
      rewardDisplay: '$200,000',
      officialUrl: 'https://www.bitget.com/mid',
    },
    {
      ...dummyBase,
      id: '5',
      exchange: 'HTX',
      title: 'Mystery Pool',
      category: '新币空投',
      rewardAmount: null, // Unknown reward
      rewardCurrency: '',
      rewardDisplay: '惊喜礼盒',
      officialUrl: 'https://www.htx.com/mystery',
    },
  ];

  const sorted = sortActivities(activities, 'rewardScale');

  // Expected ranking:
  // 1: 1,000,000 USDC (id: 3)
  // 2: 200,000 USD (id: 4)
  // 3: 20,000 USDT (id: 2)
  // 4: 500,000 TON (id: 1, non-USD placed after comparable stablecoins)
  // 5: Mystery Pool (id: 5, null reward at end)
  assert.equal(sorted[0].id, '3', 'Top should be 1,000,000 USDC');
  assert.equal(sorted[1].id, '4', 'Second should be 200,000 USD');
  assert.equal(sorted[2].id, '2', 'Third should be 20,000 USDT');
  assert.equal(sorted[3].id, '1', 'Fourth should be 500,000 TON (non-USD stablecoin)');
  assert.equal(sorted[4].id, '5', 'Last should be mystery/null reward');
});

test('Seven-Day Ending Horizon: Accurately groups daily counts', () => {
  const refTime = new Date(2026, 9, 28, 8, 0);

  const activities: Activity[] = [
    // Today (2026-10-28)
    {
      id: 'act-today-1',
      exchange: 'Binance',
      title: 'Ends today',
      category: '交易竞赛',
      rewardAmount: 10000,
      rewardCurrency: 'USDT',
      rewardDisplay: '10,000 USDT',
      publishedAt: '2026-10-20T00:00:00Z',
      startsAt: '2026-10-20T00:00:00Z',
      endsAt: new Date(2026, 9, 28, 22, 0).toISOString(),
      requirements: [],
      kycRequired: true,
      regionNote: '',
      officialUrl: 'https://www.binance.com/act1',
      sourceMode: 'scraper',
      verifiedAt: '2026-10-28T00:00:00Z',
      status: 'endingSoon',
    },
    // Tomorrow (2026-10-29)
    {
      id: 'act-tomorrow-1',
      exchange: 'OKX',
      title: 'Ends tomorrow 1',
      category: 'Launchpool',
      rewardAmount: 50000,
      rewardCurrency: 'USDT',
      rewardDisplay: '50,000 USDT',
      publishedAt: '2026-10-20T00:00:00Z',
      startsAt: '2026-10-20T00:00:00Z',
      endsAt: new Date(2026, 9, 29, 18, 0).toISOString(),
      requirements: [],
      kycRequired: true,
      regionNote: '',
      officialUrl: 'https://www.okx.com/act2',
      sourceMode: 'scraper',
      verifiedAt: '2026-10-28T00:00:00Z',
      status: 'endingSoon',
    },
    {
      id: 'act-tomorrow-2',
      exchange: 'Bitget',
      title: 'Ends tomorrow 2',
      category: '新币空投',
      rewardAmount: 20000,
      rewardCurrency: 'USDT',
      rewardDisplay: '20,000 USDT',
      publishedAt: '2026-10-20T00:00:00Z',
      startsAt: '2026-10-20T00:00:00Z',
      endsAt: new Date(2026, 9, 29, 23, 59).toISOString(),
      requirements: [],
      kycRequired: true,
      regionNote: '',
      officialUrl: 'https://www.bitget.com/act3',
      sourceMode: 'scraper',
      verifiedAt: '2026-10-28T00:00:00Z',
      status: 'endingSoon',
    },
  ];

  const horizon = computeSevenDayHorizon(activities, refTime);

  assert.equal(horizon.length, 7, 'Should produce 7 days');
  assert.equal(horizon[0].count, 1, 'Today should have 1 activity');
  assert.equal(horizon[1].count, 2, 'Tomorrow should have 2 activities');
  assert.equal(horizon[2].count, 0, 'D+2 should have 0 activities');
  assert.equal(horizon[0].isToday, true);
  assert.equal(horizon[1].dayLabel, '明天');
});

test('iCal .ics Generation: Generates valid RFC-5545 format with 2h alarm reminder', async () => {
  const { generateIcsContent, generateActivityShareText } = await import('./activity.js');
  const dummyActivity: Activity = {
    id: 'test-act-001',
    exchange: 'Binance',
    title: '币安秋季现货交易争霸赛',
    category: '交易竞赛',
    rewardAmount: 2000000,
    rewardCurrency: 'USDT',
    rewardDisplay: '2,000,000 USDT',
    publishedAt: '2026-10-15T00:00:00Z',
    startsAt: '2026-10-18T00:00:00Z',
    endsAt: '2026-10-29T16:00:00Z',
    requirements: ['现货交易量 ≥ 5,000 USDT', '完成KYC'],
    kycRequired: true,
    regionNote: '合规受限区除外',
    officialUrl: 'https://www.binance.com/zh-CN/activity/trading-2026',
    sourceMode: 'scraper',
    verifiedAt: '2026-10-28T10:00:00Z',
    status: 'open',
  };

  const ics = generateIcsContent(dummyActivity);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('SUMMARY:[Binance] 币安秋季现货交易争霸赛'));
  assert.ok(ics.includes('TRIGGER:-PT2H')); // 2-hour early notification
  assert.ok(ics.includes('URL:https://www.binance.com/zh-CN/activity/trading-2026'));
  assert.ok(ics.includes('END:VCALENDAR'));

  const shareText = generateActivityShareText(dummyActivity);
  assert.ok(shareText.includes('【Binance · 交易竞赛】币安秋季现货交易争霸赛'));
  assert.ok(shareText.includes('2,000,000 USDT'));
  assert.ok(shareText.includes('https://www.binance.com/zh-CN/activity/trading-2026'));
});

