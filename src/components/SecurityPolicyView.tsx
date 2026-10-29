import React from 'react';
import { ShieldCheck, Lock, ExternalLink, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_EXCHANGE_DOMAINS } from '../utils/activity.js';
import { ExchangeId } from '../types/activity.js';

export const SecurityPolicyView: React.FC = () => {
  const exchanges = Object.keys(OFFICIAL_EXCHANGE_DOMAINS) as ExchangeId[];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero Security Banner */}
      <div className="p-5 rounded bg-[#111111] border border-[#222222] space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#4ca6e1]" />
          <h2 className="text-base font-bold text-white tracking-tight">
            官方域名白名单与安全准则
          </h2>
        </div>
        <p className="text-xs text-[#a3a3a3] leading-relaxed">
          加密货币活动常伴随钓鱼仿冒网站风险。本页通过官方域名白名单拦截明显的非官方链接；这项检查不验证活动真实性、页面有效性或地区资格。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded bg-[#161616] border border-[#262626] space-y-1">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>无需登录与授权</span>
            </div>
            <p className="text-[11px] text-[#949494] leading-relaxed">
              全站公开可查，不请求钱包连接、不收集用户私钥、不要求注册账户。
            </p>
          </div>

          <div className="p-3 rounded bg-[#161616] border border-[#262626] space-y-1">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ca6e1]" />
              <span>全域名正则核验</span>
            </div>
            <p className="text-[11px] text-[#949494] leading-relaxed">
              支持的链接会匹配已配置的交易所域名；活动内容与最终跳转目标仍需单独核验。
            </p>
          </div>

          <div className="p-3 rounded bg-[#161616] border border-[#262626] space-y-1">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
              <span>剥离跟踪参数</span>
            </div>
            <p className="text-[11px] text-[#949494] leading-relaxed">
              链接规范化会移除部分查询参数；它无法保证目标页面是活动报名页。
            </p>
          </div>
        </div>
      </div>

      {/* Whitelist Domains Table */}
      <div className="bg-[#111111] border border-[#222222] rounded overflow-hidden">
        <div className="px-4 py-3 bg-[#161616] border-b border-[#222222] flex items-center justify-between">
          <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
            首批 8 家交易所核准官方域名列表
          </span>
          <span className="text-[11px] text-amber-300 font-mono">域名白名单</span>
        </div>

        <div className="divide-y divide-[#1e1e1e] text-xs">
          {exchanges.map((ex) => {
            const domains = OFFICIAL_EXCHANGE_DOMAINS[ex];
            return (
              <div
                key={ex}
                className="px-4 py-3 flex items-center justify-between hover:bg-[#161616] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-20 font-bold text-white font-mono">{ex}</span>
                  <div className="flex items-center gap-2">
                    {domains.map((dom) => (
                      <span
                        key={dom}
                        className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#1a2833] text-[#4ca6e1] border border-[#234257]"
                      >
                        *.{dom}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[#949494] font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>已校验安全白名单</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
