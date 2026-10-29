import { CexId } from '../types/activity.js';

export interface ExchangeApiEndpoint {
  exchange: CexId;
  name: string;
  baseUrl: string;
  pingUrl: string;
  announcementUrl?: string;
  apiDocsUrl: string;
  version: string;
  authType: 'Public REST (无需鉴权)' | 'API Key 可选';
}

export interface ApiPingResult {
  exchange: CexId;
  endpoint: string;
  httpStatus: number;
  latencyMs: number;
  status: 'online' | 'degraded' | 'offline';
  timestamp: string;
  errorMessage?: string;
}

export const OFFICIAL_EXCHANGE_APIS: Record<CexId, ExchangeApiEndpoint> = {
  Binance: {
    exchange: 'Binance',
    name: 'Binance Open API',
    baseUrl: 'https://api.binance.com',
    pingUrl: 'https://api.binance.com/api/v3/time',
    apiDocsUrl: 'https://binance-docs.github.io/apidocs/spot/en/',
    version: 'v3',
    authType: 'Public REST (无需鉴权)',
  },
  OKX: {
    exchange: 'OKX',
    name: 'OKX Open API',
    baseUrl: 'https://www.okx.com',
    pingUrl: 'https://www.okx.com/api/v5/public/time',
    apiDocsUrl: 'https://www.okx.com/docs-v5/zh/',
    version: 'v5',
    authType: 'Public REST (无需鉴权)',
  },
  Bybit: {
    exchange: 'Bybit',
    name: 'Bybit Open API',
    baseUrl: 'https://api.bybit.com',
    pingUrl: 'https://api.bybit.com/v5/market/time',
    announcementUrl: 'https://api.bybit.com/v5/announcements/index?locale=zh-MY&limit=10',
    apiDocsUrl: 'https://bybit-exchange.github.io/docs/v5/intro',
    version: 'v5',
    authType: 'Public REST (无需鉴权)',
  },
  Bitget: {
    exchange: 'Bitget',
    name: 'Bitget Open API',
    baseUrl: 'https://api.bitget.com',
    pingUrl: 'https://api.bitget.com/api/v2/public/time',
    apiDocsUrl: 'https://www.bitget.com/api-doc/common/intro',
    version: 'v2',
    authType: 'Public REST (无需鉴权)',
  },
  Gate: {
    exchange: 'Gate',
    name: 'Gate.io Open API',
    baseUrl: 'https://api.gateio.ws',
    pingUrl: 'https://api.gateio.ws/api/v4/spot/currencies/BTC',
    apiDocsUrl: 'https://www.gate.io/docs/developers/apiv4/',
    version: 'v4',
    authType: 'Public REST (无需鉴权)',
  },
  HTX: {
    exchange: 'HTX',
    name: 'HTX Open API',
    baseUrl: 'https://api.huobi.pro',
    pingUrl: 'https://api.huobi.pro/v1/common/timestamp',
    apiDocsUrl: 'https://www.htx.com/zh-cn/opendocument/',
    version: 'v1',
    authType: 'Public REST (无需鉴权)',
  },
  MEXC: {
    exchange: 'MEXC',
    name: 'MEXC Open API',
    baseUrl: 'https://api.mexc.com',
    pingUrl: 'https://api.mexc.com/api/v3/time',
    apiDocsUrl: 'https://mexcdevelop.github.io/apidocs/spot_v3_en/',
    version: 'v3',
    authType: 'Public REST (无需鉴权)',
  },
  KuCoin: {
    exchange: 'KuCoin',
    name: 'KuCoin Open API',
    baseUrl: 'https://api.kucoin.com',
    pingUrl: 'https://api.kucoin.com/api/v1/timestamp',
    apiDocsUrl: 'https://www.kucoin.com/docs/rest/overview',
    version: 'v1',
    authType: 'Public REST (无需鉴权)',
  },
};

/**
 * Ping an individual official exchange API endpoint with round-trip latency tracking.
 */
export async function pingExchangeApi(exchange: CexId): Promise<ApiPingResult> {
  const conf = OFFICIAL_EXCHANGE_APIS[exchange];
  const t0 = Date.now();
  const timestamp = new Date().toISOString();

  if (!conf) {
    return {
      exchange,
      endpoint: '',
      httpStatus: 0,
      latencyMs: 0,
      status: 'offline',
      timestamp,
      errorMessage: 'Unknown exchange',
    };
  }

  try {
    const res = await fetch(conf.pingUrl, {
      signal: AbortSignal.timeout(4000),
      headers: {
        'User-Agent': 'ExchangeActivityRadar/1.0',
        Accept: 'application/json',
      },
    });

    const latencyMs = Date.now() - t0;
    const isOnline = res.status >= 200 && res.status < 400;

    return {
      exchange,
      endpoint: conf.pingUrl,
      httpStatus: res.status,
      latencyMs,
      status: isOnline ? (latencyMs > 800 ? 'degraded' : 'online') : 'offline',
      timestamp,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - t0;
    return {
      exchange,
      endpoint: conf.pingUrl,
      httpStatus: 0,
      latencyMs,
      status: 'offline',
      timestamp,
      errorMessage: err?.message || 'Network timeout',
    };
  }
}

/**
 * Ping all 8 official exchange APIs in parallel.
 */
export async function pingAllExchangeApis(): Promise<ApiPingResult[]> {
  const exchanges = Object.keys(OFFICIAL_EXCHANGE_APIS) as CexId[];
  const promises = exchanges.map((ex) => pingExchangeApi(ex));
  return Promise.all(promises);
}
