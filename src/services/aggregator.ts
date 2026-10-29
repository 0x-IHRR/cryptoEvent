import {
  Activity,
  ExchangeId,
  SourceHealth,
  ActivitiesApiResponse,
  SourcesApiResponse,
} from '../types/activity.js';
import {
  deduplicateAndMergeActivities,
  calculateActivityStatus,
  isValidOfficialUrl,
} from '../utils/activity.js';
import manualActivitiesRaw from '../../data/manual-activities.json' with { type: 'json' };
import * as cheerio from 'cheerio';

const manualActivities = manualActivitiesRaw as Activity[];
const MAX_RESPONSE_BYTES = 1_000_000;
const sourceWarnings = new Map<ExchangeId, string>();
const CAMPAIGN_TERMS = /campaign|reward|giveaway|airdrop|bonus|festival|event|competition|contest|tournament|incentive|earn\s|apr|launchpool|staking|\bXP\b|\bpoints?\b|prize pool|win\b|任务|活动|奖励|激励|积分|瓜分|空投|竞赛|红包|加息/i;
const WALLET_TERMS = /wallet|cryptopedia|web3|钱包/i;

interface SourceDefinition {
  exchange: ExchangeId;
  displayName: string;
  officialDomain: string;
  sourceUrl: string;
  kind: 'bybit' | 'bitget' | 'kucoin' | 'paradex' | 'aster' | 'lighter' | 'okxWallet' | 'binance' | 'gate' | 'htx' | 'mexc' | 'merkl';
}

const SOURCES: SourceDefinition[] = [
  { exchange: 'Binance', displayName: 'Binance 币安', officialDomain: 'binance.com', sourceUrl: 'https://www.binance.com/en/support/announcement/list/93', kind: 'binance' },
  { exchange: 'OKX', displayName: 'OKX Wallet / Boost', officialDomain: 'okx.com', sourceUrl: 'https://web3.okx.com/boost/x-trade', kind: 'okxWallet' },
  { exchange: 'Bitget', displayName: 'Bitget', officialDomain: 'bitget.com', sourceUrl: 'https://www.bitget.com/docs/catalog/market/market-data', kind: 'bitget' },
  { exchange: 'Bybit', displayName: 'Bybit', officialDomain: 'bybit.com', sourceUrl: 'https://bybit-exchange.github.io/docs/v5/announcement', kind: 'bybit' },
  { exchange: 'Gate', displayName: 'Gate', officialDomain: 'gate.com', sourceUrl: 'https://www.gate.com/announcements/activity', kind: 'gate' },
  { exchange: 'HTX', displayName: 'HTX', officialDomain: 'htx.com', sourceUrl: 'https://www.htx.com/support/list/360000064001/', kind: 'htx' },
  { exchange: 'MEXC', displayName: 'MEXC', officialDomain: 'mexc.com', sourceUrl: 'https://www.mexc.com/announcements/latest-events/ongoing', kind: 'mexc' },
  { exchange: 'KuCoin', displayName: 'KuCoin', officialDomain: 'kucoin.com', sourceUrl: 'https://www.kucoin.com/docs-new/rest/spot-trading/market-data/get-announcements', kind: 'kucoin' },
  { exchange: 'Paradex', displayName: 'Paradex Perp DEX', officialDomain: 'paradex.trade', sourceUrl: 'https://docs.paradex.trade/docs/xp-referrals/xp', kind: 'paradex' },
  { exchange: 'Aster', displayName: 'Aster Perp DEX', officialDomain: 'asterdex.com', sourceUrl: 'https://docs.asterdex.com/program-and-rewards/points-and-campaigns/aster-convergence-stage-6', kind: 'aster' },
  { exchange: 'Lighter', displayName: 'Lighter Perp DEX', officialDomain: 'lighter.xyz', sourceUrl: 'https://docs.lighter.xyz/programs/lighter-on-robinhood-chain-points', kind: 'lighter' },
  { exchange: 'Merkl', displayName: 'Merkl 链上激励 API', officialDomain: 'merkl.xyz', sourceUrl: 'https://developers.merkl.xyz/api-reference/get/v4/opportunities', kind: 'merkl' },
];

const MERKL_PROTOCOL_IDS = ['uniswap', 'pancake-swap', 'aave', 'morpho', 'compound', 'curve', 'balancer', 'aerodrome', 'venus'];
const MERKL_DESTINATIONS: Record<string, string[]> = {
  uniswap: ['app.uniswap.org'],
  'pancake-swap': ['pancakeswap.finance'],
  aave: ['app.aave.com'],
  morpho: ['app.morpho.org'],
  compound: ['app.compound.finance', 'compound.finance'],
  curve: ['curve.fi'],
  balancer: ['balancer.fi'],
  aerodrome: ['aerodrome.finance', 'app.aerodrome.finance'],
  venus: ['venus.io', 'app.venus.io'],
};

function classifyCategory(text: string, source: ExchangeId): string {
  if (source === 'Paradex') return 'Perp DEX 激励';
  if (WALLET_TERMS.test(text)) return '钱包活动';
  if (/launchpool|launch pool/i.test(text)) return 'Launchpool';
  if (/airdrop|giveaway|空投|赠送/i.test(text)) return '新币空投';
  if (/trading competition|trading contest|competition|contest|tournament|交易竞赛/i.test(text)) return '交易竞赛';
  if (/stake|staking|deposit|充值|质押/i.test(text)) return '充值质押';
  if (/apr|earn|wealth|dual investment|理财|加息/i.test(text)) return '理财加息';
  return '任务礼包';
}

function numericReward(text: string): { amount: number | null; currency: string; display: string } {
  const knownMatch = text.match(/([\d,.]+)\s*([KMB]?)\s*\+?\s*(USDT|USDC|USD|BTC|ETH|BNB|WLFI|XRP|XP|points?|tokens?)/i);
  const tickerMatch = text.match(/([\d,.]+)\s*([KMB]?)\s*\+?\s+([A-Z][A-Z0-9]{1,9})\s+(?=giveaway|prize pool|rewards?|airdrops?)/i);
  const match = knownMatch || tickerMatch;
  if (!match) return { amount: null, currency: '', display: '官方未披露奖池' };
  const multiplier = ({ K: 1_000, M: 1_000_000, B: 1_000_000_000 } as Record<string, number>)[match[2].toUpperCase()] || 1;
  const amount = Number(match[1].replaceAll(',', '')) * multiplier;
  const currency = (match[3] || match[4]).toUpperCase();
  return {
    amount: Number.isFinite(amount) ? amount : null,
    currency,
    display: `${match[1]}${match[2].toUpperCase()} ${currency}`,
  };
}

function makeActivity(
  source: SourceDefinition,
  item: { id?: string; title: string; description?: string; rewardText?: string; rewardDisplayOverride?: string; rewardCurrencyOverride?: string; url: string; publishedAt?: string; startsAt?: string; endsAt?: string; activityCategory?: boolean; categoryOverride?: string; officialUrlKind?: 'activity' | 'listing'; statusOverride?: Activity['status']; protocolName?: string; chainName?: string; rewardAmountOverride?: number | null },
  now: Date,
): Activity | null {
  const title = item.title.trim();
  const evidenceText = `${title} ${item.description || ''}`.trim();
  if (!title || (!CAMPAIGN_TERMS.test(title) && !item.activityCategory) || !isValidOfficialUrl(item.url, source.exchange)) return null;
  const publishedAt = item.publishedAt && Number.isFinite(new Date(item.publishedAt).getTime())
    ? new Date(item.publishedAt).toISOString()
    : now.toISOString();
  const startsAt = item.startsAt && Number.isFinite(new Date(item.startsAt).getTime()) ? new Date(item.startsAt).toISOString() : '';
  const endsAt = item.endsAt && Number.isFinite(new Date(item.endsAt).getTime()) ? new Date(item.endsAt).toISOString() : '';
  const reward = numericReward(item.rewardText || title);
  return {
    id: `${source.exchange}-${item.id || encodeURIComponent(item.url)}`,
    exchange: source.exchange,
    protocolName: item.protocolName,
    chainName: item.chainName,
    title,
    category: item.categoryOverride || classifyCategory(title, source.exchange),
    rewardAmount: item.rewardAmountOverride === undefined ? reward.amount : item.rewardAmountOverride,
    rewardCurrency: item.rewardCurrencyOverride ?? reward.currency,
    rewardDisplay: item.rewardDisplayOverride ?? reward.display,
    publishedAt,
    startsAt,
    endsAt,
    requirements: [],
    kycRequired: undefined,
    regionNote: '官方公告列表未提供参与资格与地区限制，打开来源页面核实。',
    officialUrl: item.url,
    officialUrlKind: item.officialUrlKind || 'activity',
    sourceUrl: source.sourceUrl,
    evidenceText: item.description || title,
    sourceMode: 'scraper',
    verificationState: 'official-source',
    verifiedAt: now.toISOString(),
    status: item.statusOverride ?? (['Paradex', 'Aster', 'Lighter'].includes(source.exchange) ? 'open' : calculateActivityStatus(startsAt, endsAt, now)),
    description: item.description || '来自交易所官方活动公告。参与门槛、地区限制和奖池细则请以官方页面为准。',
    tags: [source.displayName, '官方公告'],
    completeness: 0,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !SOURCES.some((source) => parsed.hostname === source.officialDomain || parsed.hostname.endsWith(`.${source.officialDomain}`))) {
    throw new Error('拒绝非官方 HTTPS 来源');
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: 'application/json', 'User-Agent': 'ExchangeActivityBoard/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return JSON.parse(await readLimitedText(response, MAX_RESPONSE_BYTES));
}

async function fetchOfficialText(url: string, accept: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !SOURCES.some((source) => parsed.hostname === source.officialDomain || parsed.hostname.endsWith(`.${source.officialDomain}`))) {
    throw new Error('拒绝非官方 HTTPS 来源');
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: accept, 'User-Agent': 'ExchangeActivityBoard/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return readLimitedText(response, MAX_RESPONSE_BYTES);
}

async function readLimitedText(response: Response, byteLimit: number): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > byteLimit) throw new Error('来源响应超过大小限制');
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > byteLimit) {
        await reader.cancel();
        throw new Error('来源响应超过大小限制');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sourceMethod(source: SourceDefinition): SourceHealth['method'] {
  if (['Paradex', 'Aster', 'Lighter'].includes(source.exchange)) return '官方文档监控';
  if (source.kind === 'merkl') return '官方奖励 API';
  if (['okxWallet', 'binance', 'gate', 'htx', 'mexc'].includes(source.kind)) return '官方活动页接口';
  return '官方公开 API';
}

async function collectSource(source: SourceDefinition, now: Date): Promise<Activity[]> {
  if (source.kind === 'okxWallet') return collectOkxWallet(source, now);
  if (source.kind === 'merkl') return collectMerkl(source, now);

  if (source.kind === 'paradex') {
    const text = await fetchOfficialText(source.sourceUrl, 'text/markdown,text/html');
    if (!/Season 3 is LIVE/i.test(text) || !/4,000,000 XP/i.test(text)) throw new Error('官方 XP 页面未包含预期的 Season 3 规则');
    return [makeActivity(source, {
      title: 'Paradex Season 3 Perp DEX XP 激励：每周分发 4,000,000 XP',
      description: '官方文档称 Season 3 进行中，每周三分发 4,000,000 XP；活动结束日期及新 XP 规则尚未公布。',
      url: source.sourceUrl,
      publishedAt: '2026-02-01T00:00:00.000Z',
      startsAt: '2026-02-01T00:00:00.000Z',
    }, now)].filter((activity): activity is Activity => Boolean(activity));
  }

  if (source.kind === 'aster' || source.kind === 'lighter') {
    const text = await fetchOfficialText(`${source.sourceUrl}.md`, 'text/markdown,text/plain');
    const validProgram = source.kind === 'aster'
      ? /Aster Stage 6 Airdrop points/i.test(text) && /conclusion of Stage 6/i.test(text)
      : /Lighter on Robinhood Chain Points/i.test(text) && /distributed every Friday/i.test(text) && /live points are distributed in real time/i.test(text);
    if (!validProgram) throw new Error('官方 Perp DEX 积分规则未匹配预期活动状态');
    const title = source.kind === 'aster'
      ? 'Aster Convergence Stage 6：永续与现货交易积分'
      : 'Lighter on Robinhood Chain：永续交易积分';
    const description = source.kind === 'aster'
      ? 'Aster 官方规则称 Stage 6 对永续与现货交易计分，涵盖交易、持仓、资产、清算、盈亏及推荐因素；具体权重未公开，活动结束日期未在规则页披露。'
      : 'Lighter 官方规则称 Robinhood Chain 交易积分实时发放，并于每周五追加周度积分；Robinhood Wallet 交易量最高可获得 2 倍积分加成。资格、地区限制及周度规则以官方条款为准，活动结束日期未披露。';
    return [makeActivity(source, {
      id: source.kind === 'aster' ? 'convergence-stage-6' : 'robinhood-chain-points',
      title,
      description,
      url: source.kind === 'aster' ? 'https://www.asterdex.com/en/stage6/statistics' : source.sourceUrl,
      activityCategory: true,
      categoryOverride: 'Perp DEX 激励',
      rewardDisplayOverride: source.kind === 'aster' ? 'ASTER 空投积分（总奖池未公布）' : 'Lighter 积分（代币折算未公布）',
      rewardCurrencyOverride: 'POINTS',
      officialUrlKind: 'activity',
      statusOverride: 'open',
    }, now)].filter((activity): activity is Activity => Boolean(activity));
  }

  if (source.kind === 'bybit') {
    if (source.exchange !== 'Bybit') throw new Error('该交易所没有核实的公开活动 API');
    const raw = await fetchJson('https://api.bybit.com/v5/announcements/index?locale=en-US&limit=50');
    if (!isRecord(raw) || raw.retCode !== 0 || !isRecord(raw.result) || !Array.isArray(raw.result.list)) throw new Error('Bybit 公告响应结构异常');
    return raw.result.list.map((entry: Record<string, any>) => makeActivity(source, {
      title: String(entry.title || ''), description: String(entry.description || ''), url: String(entry.url || ''),
      publishedAt: entry.publishTime ? new Date(Number(entry.publishTime)).toISOString() : undefined,
      startsAt: entry.startDateTimestamp ? new Date(Number(entry.startDateTimestamp)).toISOString() : undefined,
      endsAt: entry.endDateTimestamp ? new Date(Number(entry.endDateTimestamp)).toISOString() : undefined,
      activityCategory: Array.isArray(entry.tags) && entry.tags.some((tag: string) => /campaign|activity|reward|earn|event/i.test(tag)),
    }, now)).filter((activity: Activity | null): activity is Activity => Boolean(activity));
  }

  if (source.kind === 'bitget') {
    const url = 'https://api.bitget.com/api/v3/public/annoucements?language=en_US&annType=latest_news&limit=10';
    const raw = await fetchJson(url);
    if (!isRecord(raw) || raw.code !== '00000' || !Array.isArray(raw.data)) throw new Error('Bitget 公告响应结构异常');
    return raw.data.map((entry: Record<string, any>) => makeActivity(source, {
      title: String(entry.annTitle || ''), description: String(entry.annDesc || ''), url: String(entry.annUrl || ''),
      publishedAt: entry.createdTime ? new Date(Number(entry.createdTime)).toISOString() : undefined,
    }, now)).filter((activity: Activity | null): activity is Activity => Boolean(activity));
  }

  if (source.kind === 'binance') {
    const raw = await fetchJson('https://www.binance.com/bapi/apex/v1/public/apex/cms/article/list/query?type=1&pageNo=1&pageSize=50&catalogId=93');
    const catalog = isRecord(raw) && isRecord(raw.data) && Array.isArray(raw.data.catalogs)
      ? raw.data.catalogs.find((entry: Record<string, any>) => Number(entry.catalogId) === 93)
      : null;
    if (!catalog || !Array.isArray(catalog.articles)) throw new Error('Binance 最新活动接口响应结构异常');
    return catalog.articles.filter((entry: Record<string, any>) => Boolean(entry.code)).map((entry: Record<string, any>) => makeActivity(source, {
      id: String(entry.id || entry.code),
      title: String(entry.title || ''),
      url: `https://www.binance.com/en/support/announcement/detail/${encodeURIComponent(String(entry.code))}`,
      publishedAt: entry.releaseDate ? new Date(Number(entry.releaseDate)).toISOString() : undefined,
      activityCategory: true,
      statusOverride: 'unknown',
    }, now)).filter((activity: Activity | null): activity is Activity => Boolean(activity));
  }

  if (source.kind === 'gate' || source.kind === 'htx' || source.kind === 'mexc') {
    return collectExchangeActivityPage(source, now);
  }

  if (source.kind === 'kucoin') {
    const url = 'https://api.kucoin.com/api/v3/announcements?currentPage=1&pageSize=50&annType=latest-announcements&lang=en_US';
    const raw = await fetchJson(url);
    if (!isRecord(raw) || raw.code !== '200000' || !isRecord(raw.data) || !Array.isArray(raw.data.items)) throw new Error('KuCoin 公告响应结构异常');
    return raw.data.items.map((entry: Record<string, any>) => {
      const categories = Array.isArray(entry.annType) ? entry.annType.join(' ') : '';
      const evidence = `${entry.annTitle || ''} ${entry.annDesc || ''} ${categories}`;
      const activityCategory = /activities/i.test(categories);
      if (!activityCategory && !CAMPAIGN_TERMS.test(String(entry.annTitle || ''))) return null;
      return makeActivity(source, {
        title: String(entry.annTitle || ''), description: String(entry.annDesc || ''), url: String(entry.annUrl || ''),
        publishedAt: entry.cTime ? new Date(Number(entry.cTime)).toISOString() : undefined,
        activityCategory,
      }, now);
    }).filter((activity: Activity | null): activity is Activity => Boolean(activity));
  }
  return [];
}

async function collectExchangeActivityPage(source: SourceDefinition, now: Date): Promise<Activity[]> {
  const html = await fetchOfficialText(source.sourceUrl, 'text/html');
  const $ = cheerio.load(html);
  const selector = source.kind === 'htx'
    ? 'a[href*="/support/"]'
    : 'a[href*="/announcements/article/"]';
  const rows = $(selector).toArray();
  const items = new Map<string, Activity>();
  for (const anchor of rows) {
    const element = $(anchor);
    const href = String(element.attr('href') || '');
    const url = new URL(href, source.sourceUrl).toString();
    const path = new URL(url).pathname;
    if (source.kind === 'gate' && !/\/announcements\/article\/\d+\/?$/.test(path)) continue;
    if (source.kind === 'htx' && !/\/support\/\d+\/?$/.test(path)) continue;
    if (source.kind === 'mexc' && !/\/announcements\/article\/[a-z0-9-]+-\d+\/?$/i.test(path)) continue;
    if (!isValidOfficialUrl(url, source.exchange)) continue;
    const text = element.text().replace(/\s+/g, ' ').trim();
    const title = text
      .replace(/\s+\d+\s*(?:minutes?|hours?|days?)\s+ago\s*\d*$/i, '')
      .replace(/\s+\d+\s*(?:分钟前|小时前|天前)\s*\d*$/, '')
      .replace(/\s+\d{1,2}\/\d{1,2}(?:\s+\d{2}:\d{2}:\d{2})?(?:\s*\(UTC\))?\s*$/, '')
      .trim();
    if (!title) continue;
    const activity = makeActivity(source, {
      title,
      url,
      activityCategory: true,
      statusOverride: source.kind === 'mexc' ? 'open' : 'unknown',
    }, now);
    if (activity) items.set(activity.officialUrl, activity);
  }
  if (items.size === 0) throw new Error(`${source.displayName} 官方活动页没有返回可识别的活动详情链接；当前运行环境可能受到页面访问限制，未尝试绕过`);
  return Array.from(items.values()).slice(0, 100);
}

async function collectMerkl(source: SourceDefinition, now: Date): Promise<Activity[]> {
  const protocolsRaw = await fetchJson(`https://api.merkl.xyz/v4/protocols/?ids=${encodeURIComponent(MERKL_PROTOCOL_IDS.join(','))}&page=0&items=100&status=LIVE`);
  if (!Array.isArray(protocolsRaw)) throw new Error('Merkl 协议目录响应结构异常');
  const protocols = protocolsRaw.filter((protocol: unknown) => isRecord(protocol)
    && MERKL_PROTOCOL_IDS.includes(String(protocol.id))
    && Number(protocol.numberOfLiveCampaigns) > 0);
  const pages = await Promise.all(protocols.map(async (protocol: Record<string, any>) => {
    const opportunities: Record<string, any>[] = [];
    try {
      for (let page = 0; page < 3; page++) {
        const url = `https://api.merkl.xyz/v4/opportunities/?status=LIVE&mainProtocolId=${encodeURIComponent(String(protocol.id))}&page=${page}&items=100&campaigns=true`;
        const raw = await fetchJson(url);
        if (!Array.isArray(raw)) throw new Error(`${protocol.name} 活动列表响应结构异常`);
        opportunities.push(...raw.filter(isRecord));
        if (raw.length < 100) break;
      }
      return { protocol, opportunities, error: '' };
    } catch (error) {
      return { protocol, opportunities, error: error instanceof Error ? error.message : '来源读取失败' };
    }
  }));

  const activities: Activity[] = [];
  const failures = pages.filter(({ error }) => error);
  if (failures.length) sourceWarnings.set(source.exchange, `${failures.length} 个协议列表读取失败：${failures.map(({ protocol }) => protocol.name).join('、')}`);
  for (const { protocol, opportunities } of pages) {
    const protocolId = String(protocol.id);
    const approvedHosts = MERKL_DESTINATIONS[protocolId] || [];
    for (const opportunity of opportunities) {
      if (opportunity.status !== 'LIVE' || !Array.isArray(opportunity.campaigns)) continue;
      const campaigns = opportunity.campaigns.filter((entry: unknown) => isRecord(entry)
        && Number(entry.endTimestamp) * 1000 > now.getTime()
        && Number(entry.startTimestamp) * 1000 <= now.getTime());
      if (!campaigns.length) continue;
      const startMs = Math.min(...campaigns.map((entry: Record<string, any>) => Number(entry.startTimestamp) * 1000));
      const endMs = Math.max(...campaigns.map((entry: Record<string, any>) => Number(entry.endTimestamp) * 1000));
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

      const rewardTotals = new Map<string, number>();
      for (const campaign of campaigns) {
        const token = campaign.rewardToken;
        const decimals = Number(token?.decimals);
        const amount = Number(campaign.amount) / 10 ** decimals;
        const symbol = String(token?.displaySymbol || token?.symbol || '');
        if (!symbol || !Number.isFinite(amount) || amount < 0 || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) continue;
        rewardTotals.set(symbol, (rewardTotals.get(symbol) || 0) + amount);
      }
      const rewardDisplay = rewardTotals.size
        ? Array.from(rewardTotals, ([symbol, amount]) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(amount)} ${symbol}`).join(' + ')
        : 'Merkl API 未提供可读奖池总额';
      const stableReward = rewardTotals.size === 1 ? Array.from(rewardTotals.entries())[0] : undefined;
      const rewardAmount = stableReward && ['USD', 'USDC', 'USDT'].includes(stableReward[0].toUpperCase()) ? stableReward[1] : null;

      const depositUrl = String(opportunity.depositUrl || '');
      const approvedDestination = (candidate: string) => {
        try {
          const parsed = new URL(candidate);
          return parsed.protocol === 'https:' && approvedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
        } catch { return false; }
      };
      const protocolUrl = String(protocol.url || '');
      const url = approvedDestination(depositUrl) ? depositUrl : approvedDestination(protocolUrl) ? protocolUrl : '';
      if (!url || !isValidOfficialUrl(url, source.exchange)) continue;

      const action = String(opportunity.action || '');
      const category = action === 'POOL' ? '链上流动性激励' : ['LEND', 'BORROW'].includes(action) ? '借贷激励' : '链上协议激励';
      const howTo = Array.isArray(opportunity.howToSteps) ? opportunity.howToSteps.map((step: unknown) => String(step)).filter(Boolean) : [];
      const details = [String(opportunity.description || ''), ...howTo.map((step: string, index: number) => `参与步骤 ${index + 1}：${step}`)];
      if (Number.isFinite(Number(opportunity.apr))) details.push(`Merkl API 当前 APR 约 ${Number(opportunity.apr).toFixed(2)}%，该值会随池子与奖励变化。`);
      if (url === protocolUrl) details.push('Merkl 未提供通过协议官方域名校验的活动直达链接，当前链接为协议官方入口。');
      const chainName = String(opportunity.chain?.name || '未知链');
      const startsAt = new Date(startMs).toISOString();
      const endsAt = new Date(endMs).toISOString();
      const activity = makeActivity(source, {
        id: `${protocolId}-${opportunity.chainId}-${opportunity.id}`,
        title: String(opportunity.name || `${protocol.name} 链上激励`),
        description: details.filter(Boolean).join(' '),
        url,
        publishedAt: opportunity.lastCampaignCreatedAt ? new Date(Number(opportunity.lastCampaignCreatedAt) * 1000).toISOString() : undefined,
        startsAt,
        endsAt,
        activityCategory: true,
        categoryOverride: category,
        rewardDisplayOverride: rewardDisplay,
        rewardCurrencyOverride: stableReward?.[0] || '',
        rewardAmountOverride: rewardAmount,
        protocolName: String(protocol.name),
        chainName,
        statusOverride: calculateActivityStatus(startsAt, endsAt, now),
      }, now);
      if (activity) {
        activity.tags = [String(protocol.name), chainName, 'Merkl 激励'];
        activity.regionNote = '链上活动资格由发起方设定；钱包地址、地区、资产和操作限制请查看活动规则。';
        activities.push(activity);
      }
    }
  }
  return activities;
}

async function collectOkxWallet(source: SourceDefinition, now: Date): Promise<Activity[]> {
  const [tradesRaw, firstLaunchPage] = await Promise.all([
    fetchJson('https://web3.okx.com/priapi/v1/dapp/campaign/list?status=1&pageNum=1&pageSize=50'),
    fetchJson('https://web3.okx.com/priapi/v1/dapp/boost/launchpool/list?type=2&pageNum=1&pageSize=50&capability=1&mode=1%2C2'),
  ]);
  if (!isRecord(tradesRaw) || tradesRaw.code !== 0 || !isRecord(tradesRaw.data) || !Array.isArray(tradesRaw.data.campaigns)) {
    throw new Error('OKX Wallet X Trade 活动响应结构异常');
  }
  if (!isRecord(firstLaunchPage) || firstLaunchPage.code !== 0 || !isRecord(firstLaunchPage.data) || !Array.isArray(firstLaunchPage.data.pools)) {
    throw new Error('OKX Wallet X Launch / X Stake 活动响应结构异常');
  }
  const totalPages = Math.min(20, Math.max(1, Number(firstLaunchPage.data.totalPages || 1)));
  const additionalPages = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) =>
    fetchJson(`https://web3.okx.com/priapi/v1/dapp/boost/launchpool/list?type=2&pageNum=${index + 2}&pageSize=50&capability=1&mode=1%2C2`),
  ));
  const launchEntries: Record<string, any>[] = [...firstLaunchPage.data.pools];
  for (const page of additionalPages) {
    if (!isRecord(page) || page.code !== 0 || !isRecord(page.data) || !Array.isArray(page.data.pools)) {
      throw new Error('OKX Wallet 活动分页响应结构异常');
    }
    launchEntries.push(...page.data.pools);
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const tradeActivities = tradesRaw.data.campaigns.map((entry: Record<string, any>) => {
    const startSeconds = Number(entry.startTime || 0);
    const endSeconds = Number(entry.endTime || 0);
    if (!entry.name || !endSeconds || endSeconds <= nowSeconds) return null;
    const directUrl = typeof entry.pcJoinLink === 'string' && isValidOfficialUrl(entry.pcJoinLink, source.exchange)
      ? entry.pcJoinLink
      : '';
    const rewards = String(entry.rewards || '');
    return makeActivity(source, {
      id: `x-trade-${entry.activityId}`,
      title: `${entry.name} · OKX Wallet X Trade 活动`,
      description: `OKX Wallet 官方活动列表显示：${entry.name}，链：${entry.chainName || '未披露'}，奖励：${rewards || '详情页公布'}。报名门槛与活动规则请打开官方入口核实。`,
      rewardText: rewards,
      url: directUrl || source.sourceUrl,
      publishedAt: startSeconds ? new Date(startSeconds * 1000).toISOString() : undefined,
      startsAt: startSeconds ? new Date(startSeconds * 1000).toISOString() : undefined,
      endsAt: new Date(endSeconds * 1000).toISOString(),
      activityCategory: true,
      categoryOverride: '钱包活动',
      officialUrlKind: directUrl ? 'activity' : 'listing',
    }, now);
  }).filter((activity: Activity | null): activity is Activity => Boolean(activity));

  const launchActivities = launchEntries.map((entry: Record<string, any>) => {
    const times = isRecord(entry.times) ? entry.times : {};
    const startMs = Number(times.joinStartTime || times.startTime || 0);
    const endMs = Number(times.joinEndTime || times.endTime || 0);
    if (!entry.name || !endMs || endMs <= now.getTime()) return null;
    const listingUrl = /stake/i.test(String(entry.name))
      ? 'https://web3.okx.com/boost/x-liquidity'
      : 'https://web3.okx.com/boost/x-launch';
    const reward = isRecord(entry.reward) ? `${entry.reward.amount ?? ''} ${entry.reward.token ?? ''}`.trim() : '';
    return makeActivity(source, {
      id: `boost-${entry.id}`,
      title: `${entry.name} · OKX Wallet Boost 活动`,
      description: `OKX Wallet 官方活动列表显示奖励为 ${reward || '以活动页为准'}；具体参与条件请在官方活动页核实。`,
      rewardText: reward,
      url: listingUrl,
      publishedAt: startMs ? new Date(startMs).toISOString() : undefined,
      startsAt: startMs ? new Date(startMs).toISOString() : undefined,
      endsAt: new Date(endMs).toISOString(),
      activityCategory: true,
      categoryOverride: '钱包活动',
      officialUrlKind: 'listing',
    }, now);
  }).filter((activity: Activity | null): activity is Activity => Boolean(activity));

  const activities = [...tradeActivities, ...launchActivities];
  try {
    activities.push(...await collectOkxLiquidity(source, now));
  } catch (error) {
    sourceWarnings.set(source.exchange, `X Liquidity 页面读取失败：${error instanceof Error ? error.message : '来源读取失败'}`);
  }
  return activities;
}

async function collectOkxLiquidity(source: SourceDefinition, now: Date): Promise<Activity[]> {
  const html = await fetchOfficialText('https://web3.okx.com/boost/x-liquidity', 'text/html');
  const $ = cheerio.load(html);
  const stateText = $('script#appState[type="application/json"]').text();
  if (!stateText || !/Event ongoing/i.test(html)) throw new Error('OKX 官方页面没有提供进行中标记或活动数据');
  const state: unknown = JSON.parse(stateText);
  if (!isRecord(state) || !isRecord(state.appContext) || !isRecord(state.appContext.initialProps) || !isRecord(state.appContext.initialProps.XLiquidity)) {
    throw new Error('OKX X Liquidity 页面数据结构异常');
  }
  const entryData = state.appContext.initialProps.XLiquidity.entryData;
  if (!isRecord(entryData) || !Array.isArray(entryData.displayList) || !isRecord(entryData.reward)) {
    throw new Error('OKX X Liquidity 奖励或流动性池数据缺失');
  }
  const totalReward = String(entryData.reward.amount || '');
  const currency = String(entryData.reward.tokenSymbol || '');
  if (!/^\d+(?:\.\d+)?$/.test(totalReward) || !currency || Number(entryData.endTime) !== 0) {
    throw new Error('OKX X Liquidity 活动状态或奖池格式无法核验');
  }
  const summary = `OKX Wallet 官方页面标记活动进行中；页面列出的整体奖励池为 ${Number(totalReward).toLocaleString('en-US')} ${currency}。该数字是整场活动奖励池，不代表单个池的独享奖励。`;
  const activities = entryData.displayList.map((pool: Record<string, any>) => {
    const detailPath = String(pool.detailPath || '');
    if (!/^[a-z0-9-]+$/.test(detailPath)) return null;
    const protocol = String(pool.protocolName || '协议未公布');
    const pair = String(pool.investmentName || '流动性池');
    const poolDisplay = `${Number(totalReward).toLocaleString('en-US')} ${currency}`;
    return makeActivity(source, {
      id: `x-liquidity-${entryData.activityId}-${pool.investmentId || detailPath}`,
      title: `OKX Wallet X Liquidity：${protocol} ${pair} 流动性活动`,
      description: `${summary} 此条记录对应 ${protocol} 的 ${pair} 池。存入资产、智能合约、无常损失及奖励规则请打开对应活动详情核实。`,
      url: `https://web3.okx.com/boost/x-liquidity/${detailPath}`,
      activityCategory: true,
      categoryOverride: '钱包活动',
      rewardDisplayOverride: poolDisplay,
      rewardCurrencyOverride: currency,
      rewardAmountOverride: null,
      officialUrlKind: 'activity',
      statusOverride: 'open',
    }, now);
  }).filter((activity: Activity | null): activity is Activity => Boolean(activity));
  if (activities.length === 0) throw new Error('OKX X Liquidity 页面没有可用的活动池记录');
  return activities;
}

class ActivityAggregatorService {
  private cachedActivities: Activity[] = [];
  private sourceHealthMap = new Map<ExchangeId, SourceHealth>();
  private lastUpdated = new Date().toISOString();
  private isRefreshing = false;

  constructor() {
    for (const source of SOURCES) {
      const connected = true;
      this.sourceHealthMap.set(source.exchange, {
        exchange: source.exchange,
        displayName: source.displayName,
        method: sourceMethod(source),
        mode: 'scraper',
        status: 'degraded',
        httpStatus: 0,
        activityCount: 0,
        lastScrapedAt: '',
        lastSuccessAt: '',
        parserType: connected ? source.kind : '仅官方入口待核验',
        note: source.exchange === 'OKX'
          ? '监控 OKX Wallet X Trade、X Launch、X Stake 官方活动页接口，并解析 X Liquidity 官方活动页；页面接口未列入公开 API 文档。'
          : source.exchange === 'Merkl'
          ? '从 Merkl 官方分页 API 读取受监控的 DEX 与借贷协议奖励活动；奖池总额取活动 campaign 配置，APR 为动态估值。'
          : ['Binance', 'Gate', 'HTX', 'MEXC'].includes(source.exchange)
          ? '读取官方活动分类列表；列表未披露活动起止时间时会保留待核实状态，MEXC 来源使用官方“进行中”活动分类。'
          : source.exchange === 'Aster' || source.exchange === 'Lighter'
          ? '监控官方 Perp DEX 积分规则页面；页面可证明活动规则存在，但奖池估值和结束时间可能未披露。'
          : '等待首次官方来源读取。',
        officialDomain: source.officialDomain,
        sourceUrl: source.sourceUrl,
      });
    }
  }

  public async refreshAll(now: Date = new Date()): Promise<ActivitiesApiResponse> {
    if (this.isRefreshing) return this.getActivitiesResponse();
    this.isRefreshing = true;
    try {
      const collected = await Promise.all(SOURCES.map(async (source) => {
        const health = this.sourceHealthMap.get(source.exchange)!;
        sourceWarnings.delete(source.exchange);
        health.lastScrapedAt = now.toISOString();
        try {
          const items = await collectSource(source, now);
          health.activityCount = items.length;
          health.status = sourceWarnings.has(source.exchange) ? 'degraded' : 'operational';
          health.httpStatus = 200;
          health.lastSuccessAt = now.toISOString();
          health.method = sourceMethod(source);
          health.note = items.length
            ? `读取成功，发现 ${items.length} 条候选活动；未从来源返回的门槛和资格仍需在活动规则页核实。${sourceWarnings.has(source.exchange) ? ` ${sourceWarnings.get(source.exchange)}` : ''}`
            : source.exchange === 'OKX' ? '读取成功，当前没有剩余报名时间的 X Trade、X Launch 或 X Stake 活动。' : '读取成功，本次没有符合筛选条件的活动。';
          return items;
        } catch (error) {
          health.status = 'degraded';
          health.httpStatus = Number(String(error).match(/HTTP (\d+)/)?.[1] || 0);
          health.method = sourceMethod(source);
          health.note = error instanceof Error ? error.message : '来源读取失败';
          return [];
        }
      }));

      const raw = deduplicateAndMergeActivities(collected.flat(), manualActivities, now);
      this.cachedActivities = raw.filter((activity) => isValidOfficialUrl(activity.officialUrl, activity.exchange));
      for (const health of this.sourceHealthMap.values()) {
        const manualCount = manualActivities.filter((activity) => activity.exchange === health.exchange).length;
        health.activityCount = Math.max(health.activityCount, manualCount);
        if (manualCount && health.status !== 'operational') {
          health.status = 'fallback_active';
          health.method = '人工补录';
        }
      }
      this.lastUpdated = now.toISOString();
      return this.getActivitiesResponse();
    } finally {
      this.isRefreshing = false;
    }
  }

  public getActivitiesResponse(): ActivitiesApiResponse {
    const activities = [...this.cachedActivities];
    let openCount = 0;
    let endingSoonCount = 0;
    let upcomingCount = 0;
    let totalRewardUsdValue = 0;
    for (const activity of activities) {
      if (activity.status === 'open' || activity.status === 'endingSoon') openCount++;
      if (activity.status === 'endingSoon') endingSoonCount++;
      if (activity.status === 'upcoming') upcomingCount++;
      if (activity.rewardAmount && ['USDT', 'USD', 'USDC'].includes(activity.rewardCurrency.toUpperCase())) totalRewardUsdValue += activity.rewardAmount;
    }
    return { updatedAt: this.lastUpdated, total: activities.length, stats: { openCount, endingSoonCount, upcomingCount, totalRewardUsdValue }, activities };
  }

  public getSourcesResponse(): SourcesApiResponse {
    return { updatedAt: this.lastUpdated, sources: Array.from(this.sourceHealthMap.values()) };
  }
}

export const activityAggregator = new ActivityAggregatorService();
