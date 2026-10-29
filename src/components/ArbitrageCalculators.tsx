import React, { useState } from 'react';
import { Check, Clipboard, Bot, ChevronDown, ChevronUp, Copy, Sparkles, ExternalLink } from 'lucide-react';
import { Activity } from '../types/activity.js';
import { generateActivityResearchPrompt } from '../utils/activity.js';

interface ArbitrageCalculatorsProps {
  activity: Activity;
}

export const ArbitrageCalculators: React.FC<ArbitrageCalculatorsProps> = ({ activity }) => {
  const [promptCopied, setPromptCopied] = useState<boolean>(false);
  const [summaryCopied, setSummaryCopied] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const fullPrompt = generateActivityResearchPrompt(activity);
  const platformName = activity.protocolName || activity.exchange;

  const handleCopyPrompt = async () => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2400);
    } catch {
      setCopyError('浏览器未允许剪贴板访问，请手动展开下方预览框复制。');
    }
  };

  const handleCopySummary = async () => {
    setCopyError(null);
    const shortText = [
      `【${platformName}】${activity.title}`,
      `分类：${activity.category}`,
      `奖池：${activity.rewardDisplay}`,
      `时间：${activity.startsAt || '即刻'} ~ ${activity.endsAt || '进行中'}`,
      `规则链接：${activity.officialUrl}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(shortText);
      setSummaryCopied(true);
      window.setTimeout(() => setSummaryCopied(false), 2400);
    } catch {
      setCopyError('复制失败，请重试。');
    }
  };

  return (
    <section className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#181818] px-4 py-3 border-b border-[#262626] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#162736] border border-[#23455f] flex items-center justify-center text-[#4ca6e1]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white tracking-tight">
              活动研究 Prompt · 外部 AI 策略生成
            </h3>
            <p className="text-[11px] text-[#949494]">
              已整合本活动全部规则字段与官方直达链接
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f1f1f] text-[#a3a3a3] border border-[#2e2e2e]">
          支持任意大模型
        </span>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-4">
        <p className="text-xs text-[#a3a3a3] leading-relaxed">
          将此 Prompt 直接粘贴至 <strong className="text-white font-medium">ChatGPT、Claude、DeepSeek 或 Gemini</strong> 等大模型中，AI 将结合官方链接与细则，为你分析分配机制、测算资金磨损，并输出针对性的实战操作策略。
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className={`flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 h-9 px-4 rounded text-xs font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ca6e1] cursor-pointer ${
              promptCopied
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'bg-[#4ca6e1] hover:bg-[#3b93cc] active:bg-[#347fae] text-black'
            }`}
          >
            {promptCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>已复制 Prompt！可直接发送给 AI</span>
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4" />
                <span>复制完整活动研究 Prompt</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded text-xs font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ca6e1] cursor-pointer ${
              summaryCopied
                ? 'bg-[#182a20] text-emerald-300 border-[#2d5238]'
                : 'bg-[#1a1a1a] hover:bg-[#242424] text-[#d1d5db] hover:text-white border-[#2e2e2e]'
            }`}
          >
            {summaryCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#949494]" />}
            <span>{summaryCopied ? '已复制要点' : '仅复制信息备忘'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center justify-center gap-1 h-9 px-2.5 rounded text-xs text-[#949494] hover:text-white hover:bg-[#1f1f1f] border border-[#2b2b2b] transition-colors cursor-pointer"
          >
            <span>{showPreview ? '收起预览' : '查看 Prompt 预览'}</span>
            {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {copyError && (
          <p role="alert" className="text-xs text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-900">
            {copyError}
          </p>
        )}

        {/* Collapsible Prompt Preview Area */}
        {showPreview && (
          <div className="space-y-2 pt-2 border-t border-[#222222]">
            <div className="flex items-center justify-between text-[11px] text-[#949494]">
              <span>Prompt 预览内容 ({fullPrompt.length} 字符)：</span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="text-[#4ca6e1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>全选复制</span>
              </button>
            </div>
            <pre className="p-3 bg-[#0d0d0d] border border-[#222222] rounded text-[11px] font-mono text-[#d1d5db] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto select-all">
              {fullPrompt}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
};
