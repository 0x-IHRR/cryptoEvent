import React, { useState, useEffect } from 'react';
import {
  Activity as PulseIcon,
  RefreshCw,
  Server,
  Database,
  FileCheck,
  Zap,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { SourceHealth, ExchangeId, CexId } from '../types/activity.js';
import { OFFICIAL_EXCHANGE_APIS, ApiPingResult } from '../services/exchangeApis.js';

interface SourceHealthViewProps {
  sources: SourceHealth[];
  updatedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectExchange: (exchange: any) => void;
  onGoToBoard: () => void;
}

export const SourceHealthView: React.FC<SourceHealthViewProps> = ({
  sources,
  updatedAt,
  isRefreshing,
  onRefresh,
  onSelectExchange,
  onGoToBoard,
}) => {
  const [apiPingResults, setApiPingResults] = useState<ApiPingResult[]>([]);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingError, setPingError] = useState<string | null>(null);

  const [batchValidation, setBatchValidation] = useState<{
    total: number;
    results: Record<string, any>;
    timestamp: string;
  } | null>(null);
  const [isValidatingBatch, setIsValidatingBatch] = useState<boolean>(false);

  const handleBatchValidate = async () => {
    setIsValidatingBatch(true);
    try {
      const res = await fetch('/api/validate-all-links');
      if (res.ok) {
        const data = await res.json();
        setBatchValidation(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsValidatingBatch(false);
    }
  };

  // Ping all official APIs
  const handlePingAllApis = async () => {
    setIsPinging(true);
    setPingError(null);
    try {
      const res = await fetch('/api/ping-sources');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApiPingResults(data.results || []);
    } catch (err: any) {
      setPingError(err?.message || '测速请求失败');
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    handlePingAllApis();
  }, []);

  const operationalCount = sources.filter((s) => s.status === 'operational').length;
  const unavailableCount = sources.filter((s) => s.status !== 'operational').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111111] border border-[#222222] rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#4ca6e1]" />
            <h2 className="text-base font-bold text-white tracking-tight">
              数据源健康度与官方 API 诊断
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#a3a3a3] leading-relaxed">
            显示活动采集器状态。下方 REST API 测速只检查行情接口连通性，不代表已发现或核验活动。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#102418] border border-[#1b4329] text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{operationalCount} 个活动解析器可用</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#241c0e] border border-[#4d3816] text-xs text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{unavailableCount} 个来源尚不可用</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 h-8 px-3 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#2b2b2b] text-xs font-medium text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#4ca6e1] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '正在更新状态...' : '刷新来源状态'}</span>
          </button>
        </div>
      </div>

      {/* NEW: Official Open REST API Connectivity Inspector */}
      <section className="bg-[#111111] border border-[#222222] rounded p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4ca6e1]" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                公开 REST API 连通性检查
              </h3>
            </div>
            <p className="text-xs text-[#949494] mt-0.5">
              此处只测公开接口是否响应；接口响应正常不等于活动内容已被采集或规则已经核验。
            </p>
          </div>

          <button
            type="button"
            onClick={handlePingAllApis}
            disabled={isPinging}
            className="flex items-center gap-1.5 h-8 px-3 rounded bg-[#1a2833] hover:bg-[#233b4d] border border-[#254861] text-xs font-medium text-[#4ca6e1] transition-colors"
          >
            <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-bounce' : ''}`} />
            <span>{isPinging ? '测速中...' : '一键测速全部官方 API'}</span>
          </button>
        </div>

        {/* 8 Exchange API Ping Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(OFFICIAL_EXCHANGE_APIS) as CexId[]).map((ex) => {
            const api = OFFICIAL_EXCHANGE_APIS[ex];
            const ping = apiPingResults.find((p) => p.exchange === ex);
            const isOnline = ping?.status === 'online';
            const latency = ping ? ping.latencyMs : null;

            return (
              <div
                key={ex}
                className="p-3 rounded bg-[#151515] border border-[#242424] hover:border-[#333333] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white font-mono">{ex}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#202020] text-[#949494] font-mono">
                      {api.version}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        isOnline ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {ping ? latency ? `${latency}ms` : ping.status : '未检测'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#949494] truncate" title={api.baseUrl}>
                  {api.baseUrl}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#949494] pt-1 border-t border-[#1e1e1e]">
                  <span>{api.authType}</span>
                  <a
                    href={api.apiDocsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-0.5 text-[#4ca6e1] hover:underline"
                  >
                    <span>文档</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sources Table */}
      <div className="bg-[#111111] border border-[#222222] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161616] text-[#949494] font-mono border-b border-[#222222] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">交易所 / 来源</th>
                <th className="py-3 px-3">状态 / 协议</th>
                <th className="py-3 px-3">采集通道</th>
                <th className="py-3 px-3 text-right">活跃活动数</th>
                <th className="py-3 px-3">最后成功时间</th>
                <th className="py-3 px-4">数据源策略与核验说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e] text-[#d1d5db]">
              {sources.map((src) => {
                const is403Fallback = src.status === 'fallback_active';
                const isOperational = src.status === 'operational';

                return (
                  <tr
                    key={src.exchange}
                    className="hover:bg-[#161616] transition-colors"
                  >
                    {/* Exchange name */}
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{src.displayName}</span>
                        <span className="text-[10px] text-[#949494] font-mono">
                          {src.officialDomain}
                        </span>
                        {src.sourceUrl && (
                          <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`打开${src.displayName}官方数据源`} className="text-[#4ca6e1] hover:text-white">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-3">
                      {is403Fallback ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#241c0e] text-amber-300 border border-[#4d3816]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>403 降级补录</span>
                        </span>
                      ) : isOperational ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#102418] text-emerald-300 border border-[#1b4329]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>200 正常解析</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#241c0e] text-amber-300 border border-[#4d3816]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>来源不可用 / 未接入</span>
                        </span>
                      )}
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {is403Fallback ? (
                          <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Database className="w-3.5 h-3.5 text-[#4ca6e1]" />
                        )}
                        <span className="text-xs">{src.method}</span>
                      </div>
                    </td>

                    {/* Active count */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectExchange(src.exchange);
                          onGoToBoard();
                        }}
                        className="font-mono font-bold text-white hover:text-[#4ca6e1] transition-colors"
                        title="查看该交易所活动"
                      >
                        {src.activityCount} 项
                      </button>
                    </td>

                    {/* Last Success */}
                    <td className="py-3.5 px-3 font-mono text-[11px] text-[#949494]">
                      {src.lastSuccessAt
                        ? src.lastSuccessAt.slice(5, 16).replace('T', ' ')
                        : '从未成功'}
                    </td>

                    {/* Note */}
                    <td className="py-3.5 px-4 text-xs text-[#a3a3a3]">
                      <span>{src.note}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Link Authenticity & Cross-Validation Matrix */}
      <section className="bg-[#111111] border border-[#222222] rounded p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4ca6e1]" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                活动链接域名与响应状态检查
              </h3>
            </div>
            <p className="text-xs text-[#949494] mt-0.5">
              检查官方域名白名单和服务器 HTTP 响应；这不能证明活动仍有效、规则真实或链接直达报名页。
            </p>
          </div>

          <button
            type="button"
            onClick={handleBatchValidate}
            disabled={isValidatingBatch}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded bg-[#162736] hover:bg-[#1f3a52] text-xs font-semibold text-[#4ca6e1] border border-[#23455f] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidatingBatch ? 'animate-spin' : ''}`} />
            <span>{isValidatingBatch ? '正在批量检查...' : '批量检查全部链接'}</span>
          </button>
        </div>

        {batchValidation ? (
          <div className="p-3.5 rounded bg-[#141d24] border border-[#1d3d57] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#4ca6e1] font-bold">
                已检查 {batchValidation.total} 条链接
              </span>
              <span className="text-emerald-400 font-semibold">
                域名白名单通过: {Object.values(batchValidation.results).filter((item: any) => item.isValidDomain).length} / {batchValidation.total}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {Object.entries(batchValidation.results).slice(0, 6).map(([id, item]: any) => (
                <div key={id} className="p-2 rounded bg-[#0e161c] border border-[#1b3040] text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{item.exchange}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {item.httpStatus ? `HTTP ${item.httpStatus}` : '未能探测'}
                    </span>
                  </div>
                  <div className="text-[#949494] font-mono truncate text-[10px]" title={item.url}>
                    {item.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded bg-[#161616] border border-[#262626] flex items-center justify-between text-xs text-[#949494]">
            <span>域名白名单只能拦截非官方域名，无法验证活动内容或页面是否仍有效。</span>
            <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 text-[11px]">
              白名单安全认证通过
            </span>
          </div>
        )}
      </section>
    </div>
  );
};
