import React, { useEffect, useState } from 'react';
import { Check, Clipboard, RefreshCw, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Activity } from '../types/activity.js';
import { ArbitrageAnalysisResult } from '../services/aiStrategy.js';
import { generateActivityResearchPrompt } from '../utils/activity.js';

interface ArbitrageCalculatorsProps {
  activity: Activity;
}

export const ArbitrageCalculators: React.FC<ArbitrageCalculatorsProps> = ({ activity }) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'ai'>('prompt');
  const [aiResult, setAiResult] = useState<ArbitrageAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptCopyError, setPromptCopyError] = useState<string | null>(null);

  useEffect(() => {
    setAiResult(null);
    setAiError(null);
  }, [activity]);

  const handleCopyResearchPrompt = async () => {
    setPromptCopyError(null);
    try {
      await navigator.clipboard.writeText(generateActivityResearchPrompt(activity));
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2200);
    } catch {
      setPromptCopyError('浏览器未允许复制，请检查剪贴板权限后重试。');
    }
  };

  const handleFetchAiStrategy = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || `AI 服务返回 HTTP ${response.status}`);
      }
      setAiResult(await response.json() as ArbitrageAnalysisResult);
    } catch (error: unknown) {
      setAiError(error instanceof Error && error.name === 'TimeoutError'
        ? 'AI 请求超过 25 秒，已停止等待。请稍后重试。'
        : error instanceof Error ? error.message : 'AI 请求失败，请稍后重试');
    } finally {
      setIsAiLoading(false);
    }
  };

  const sourceName = activity.exchange === 'Merkl' ? 'Merkl 公开奖励 API' : `${activity.exchange} 官方活动来源`;
  const availableFields = [
    activity.chainName && `所在链：${activity.chainName}`,
    activity.rewardDisplay && `奖励：${activity.rewardDisplay}`,
    activity.endsAt && `截止时间：${activity.endsAt}`,
    activity.requirements?.length && `已记录 ${activity.requirements.length} 项门槛`,
  ].filter(Boolean).join('；');
  const aiScope = `本活动记录来自${sourceName}，类型为“${activity.category}”。${availableFields || '当前记录没有提供链、奖励或截止时间。'} 网页 AI 只读取本页已保存字段，不会访问官方规则页；缺失信息会标为未核实。`;

  return (
    <section className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
      <div className="bg-[#181818] px-4 py-2.5 border-b border-[#262626] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#4ca6e1]" />
          <span className="text-[10px] px-2 py-0.5 rounded border font-mono font-semibold bg-[#202020] border-[#363636] text-[#d4d4d4]">
            活动类型：{activity.category}
          </span>
        </div>
        <div className="inline-flex rounded bg-[#111111] p-0.5 border border-[#2b2b2b]" role="tablist" aria-label="活动研究方式">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'prompt'}
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ca6e1] ${activeTab === 'prompt' ? 'bg-[#222222] text-[#4ca6e1]' : 'text-[#949494] hover:text-white'}`}
          >
            <Clipboard className="w-3 h-3" />
            <span>外部 AI Prompt</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ca6e1] ${activeTab === 'ai' ? 'bg-[#222222] text-[#4ca6e1]' : 'text-[#949494] hover:text-white'}`}
          >
            <Sparkles className="w-3 h-3 text-[#4ca6e1]" />
            <span>网页 AI 分析</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'prompt' && (
          <div className="space-y-3 text-center">
            <p className="text-xs text-[#a3a3a3] leading-relaxed">
              Prompt 会附上本条活动的已采集字段、来源原文、官方链接和核验时间，并要求外部 AI 打开规则页、翻译内容、区分已证实信息与推断。本功能只复制文本，不调用 AI 服务。
            </p>
            <button
              type="button"
              onClick={handleCopyResearchPrompt}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded bg-[#4ca6e1] hover:bg-[#3b93cc] active:bg-[#347fae] text-xs font-bold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ca6e1]"
            >
              {promptCopied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
              <span>{promptCopied ? '已复制活动研究 Prompt' : '复制活动研究 Prompt'}</span>
            </button>
            {promptCopyError && <p role="alert" className="text-[11px] text-amber-300">{promptCopyError}</p>}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <p className="text-xs text-[#a3a3a3] leading-relaxed max-w-2xl mx-auto">{aiScope}</p>
              <p className="text-[11px] text-[#949494]">
                网页 AI 使用已配置的 Gemini API，费用或免费额度取决于该 API 项目的当前方案；它不会联网核验活动规则。需要读取官网内容时，请使用外部 AI Prompt。
              </p>
              <button
                type="button"
                onClick={handleFetchAiStrategy}
                disabled={isAiLoading}
                className="mx-auto flex items-center justify-center gap-1.5 h-8 px-3.5 rounded bg-[#4ca6e1] hover:bg-[#3b93cc] active:bg-[#347fae] text-xs font-bold text-black disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ca6e1]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiLoading ? 'AI 分析中...' : '分析已有活动字段'}</span>
              </button>
            </div>

            {isAiLoading && (
              <div className="p-6 text-center bg-[#111111] rounded border border-[#222222] space-y-2" role="status">
                <RefreshCw className="w-5 h-5 text-[#4ca6e1] animate-spin mx-auto" />
                <p className="text-xs text-[#949494]">正在分析已保存字段，不会读取官方链接正文。</p>
              </div>
            )}
            {aiError && !isAiLoading && (
              <div role="alert" className="p-3 rounded bg-[#2b2518] border border-[#554522] text-amber-200 text-xs">
                {aiError}。本次没有生成可用的 AI 建议。
              </div>
            )}
            {!aiResult && !aiError && !isAiLoading && (
              <p className="text-[11px] text-[#949494]">分析结果基于采集字段，不能视为已阅读活动规则或核实收益。</p>
            )}
            {aiResult && !isAiLoading && (
              <div className="space-y-3 text-xs">
                <p className={`text-[11px] ${aiResult.analysisSource === 'gemini' ? 'text-sky-200' : 'text-amber-200'}`}>
                  {aiResult.analysisNote || '来源说明缺失；请勿将结果视为已核验建议。'}
                </p>
                <div className="p-3.5 rounded bg-[#131d27] border border-[#1d3d57] text-[#d6ecfb]">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#4ca6e1]" />
                    <span>分析摘要：{aiResult.summary}</span>
                  </div>
                  <p className="leading-relaxed text-[#badbf2] text-[11px]">{aiResult.arbitrageStrategy.coreConcept}</p>
                </div>
                <div className="p-3 rounded bg-[#111111] border border-[#222222] space-y-2">
                  <div className="text-[11px] text-[#949494]">AI 根据现有字段提出的研究方向，执行前需自行核对官方规则</div>
                  {aiResult.arbitrageStrategy.steps.map((step) => (
                    <div key={step.step} className="text-[#d1d5db] text-[11px]">
                      <strong className="text-white">{step.step}. {step.title}：</strong>{step.detail}
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded bg-[#111111] border border-[#222222] text-[#d1d5db] text-[11px] space-y-1">
                  {aiResult.ruleBreakdown.map((item, index) => <p key={index}>• {item}</p>)}
                  <p>费用与时间风险：{aiResult.frictionAnalysis.feesNote}；{aiResult.frictionAnalysis.timingWarning}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
