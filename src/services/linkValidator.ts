import { ExchangeId } from '../types/activity.js';
import { isValidOfficialUrl, OFFICIAL_EXCHANGE_DOMAINS } from '../utils/activity.js';

export interface LinkValidationResult {
  url: string;
  exchange: ExchangeId;
  isValidDomain: boolean;
  domain: string;
  httpStatus: number;
  status: 'verified_live' | 'verified_portal' | 'cloudflare_protected' | 'network_timeout' | 'invalid_domain';
  latencyMs: number;
  statusLabel: string;
  verifiedAt: string;
  checkedVia: 'http_get' | 'domain_certified';
}

/**
 * Validate a single activity official URL.
 * Checks against the official exchange domain whitelist and performs an active HTTP probe.
 */
export async function validateActivityUrl(
  url: string,
  exchange: ExchangeId
): Promise<LinkValidationResult> {
  const t0 = Date.now();
  const nowIso = new Date().toISOString();

  // 1. Domain security whitelist check
  const isValidDomain = isValidOfficialUrl(url, exchange);
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = 'invalid';
  }

  if (!isValidDomain) {
    return {
      url,
      exchange,
      isValidDomain: false,
      domain,
      httpStatus: 0,
      status: 'invalid_domain',
      latencyMs: Date.now() - t0,
      statusLabel: '非官方授权域名 (已阻断)',
      verifiedAt: nowIso,
      checkedVia: 'domain_certified',
    };
  }

  // 2. Perform live network probe with browser User-Agent
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - t0;
    const httpStatus = res.status;

    if (httpStatus >= 200 && httpStatus < 400) {
      return {
        url,
        exchange,
        isValidDomain: true,
        domain,
        httpStatus,
        status: 'verified_live',
        latencyMs,
        statusLabel: `官方域名返回 HTTP ${httpStatus}；未核验活动内容与规则`,
        verifiedAt: nowIso,
        checkedVia: 'http_get',
      };
    }

    if (httpStatus === 403) {
      return {
        url,
        exchange,
        isValidDomain: true,
        domain,
        httpStatus: 403,
        status: 'cloudflare_protected',
        latencyMs,
        statusLabel: '服务器收到 HTTP 403；浏览器能否打开及活动是否存在均未确认',
        verifiedAt: nowIso,
        checkedVia: 'http_get',
      };
    }

    return {
      url,
      exchange,
      isValidDomain: true,
      domain,
      httpStatus,
      status: 'verified_portal',
      latencyMs,
      statusLabel: `官方域名返回 HTTP ${httpStatus}；活动页面未确认`,
      verifiedAt: nowIso,
      checkedVia: 'http_get',
    };
  } catch (err: any) {
    const latencyMs = Date.now() - t0;
    return {
      url,
      exchange,
      isValidDomain: true,
      domain,
      httpStatus: 0,
      status: 'network_timeout',
      latencyMs,
      statusLabel: '服务器无法确认链接是否可打开；活动页面未核验',
      verifiedAt: nowIso,
      checkedVia: 'domain_certified',
    };
  }
}

/**
 * Validate multiple URLs in parallel with concurrency limit.
 */
export async function batchValidateUrls(
  items: Array<{ url: string; exchange: ExchangeId; id: string }>
): Promise<Record<string, LinkValidationResult>> {
  const results: Record<string, LinkValidationResult> = {};
  
  // Batch in chunks of 6 to avoid hammering
  const chunkSize = 6;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (item) => {
      const res = await validateActivityUrl(item.url, item.exchange);
      results[item.id] = res;
    });
    await Promise.all(chunkPromises);
  }

  return results;
}
