import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  placement?: 'bottom' | 'top' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="hero-stats"]',
    title: '1. 全网奖池与 72h 急迫总览',
    description:
      '这里汇总从交易所官方公告和协议官方文档读取到的活动候选。活动条款、参与资格和截止时间以活动详情页为准；未核实字段会明确标出。',
    placement: 'bottom',
  },
  {
    targetSelector: '[data-tour="seven-day-horizon"]',
    title: '2. 七日截止带 · 时间线透视',
    description:
      '按天聚合官方来源明确给出截止时间的活动。截止时间尚未公布的项目不会猜测日期。',
    placement: 'bottom',
  },
  {
    targetSelector: '[data-tour="exchange-pills"]',
    title: '3. 交易所筛选与真实数据源状态',
    description:
      '可以按交易所或协议筛选活动。「数据源健康监控」会显示各官方来源的读取状态；行情 API 在线不代表活动规则已核实。',
    placement: 'bottom',
  },
  {
    targetSelector: '[data-tour="activity-tools"]',
    title: '4. 活动筛选与一键复制研究 Prompt',
    description:
      '点击任意活动卡片可查看详细门槛与官方直达链接，并可一键复制专属研究 Prompt 发给 ChatGPT、Claude 或 DeepSeek 制定实操策略。',
    placement: 'top',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target rect when step changes or on resize/scroll
  useEffect(() => {
    if (!isOpen) return;

    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const updateRect = () => setTargetRect(el.getBoundingClientRect());
    const frame = window.requestAnimationFrame(updateRect);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isOpen, currentStepIndex, step]);

  if (!isOpen) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="新手使用引导"
      className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-none"
    >
      {/* 用四块遮罩保留目标区域原样可见，不对页面内容施加模糊滤镜。 */}
      {targetRect ? (
        <>
          <div className="absolute inset-x-0 top-0 bg-black/65" style={{ height: Math.max(0, targetRect.top - 6) }} />
          <div
            className="absolute bg-black/65"
            style={{ top: targetRect.top - 6, left: 0, width: Math.max(0, targetRect.left - 6), height: targetRect.height + 12 }}
          />
          <div
            className="absolute bg-black/65"
            style={{ top: targetRect.top - 6, left: targetRect.right + 6, right: 0, height: targetRect.height + 12 }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/65" style={{ top: targetRect.bottom + 6 }} />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/65" />
      )}

      {/* Spotlight cutout / Glowing focus ring over target element */}
      {targetRect && (
        <div
          style={{
            position: 'absolute',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 8,
            boxShadow: '0 0 20px 2px rgba(76, 166, 225, 0.6)',
            border: '2px solid #4ca6e1',
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      {/* Tooltip Dialog Card */}
      <div
        className="fixed z-50 max-w-md w-[92vw] sm:w-[420px] bg-[#111111] border border-[#2a2a2a] shadow-2xl rounded-lg p-5 text-[#f3f4f6] pointer-events-auto"
        style={{
          top: targetRect
            ? Math.min(
                window.innerHeight - 240,
                Math.max(20, targetRect.bottom + 16)
              )
            : '50%',
          left: targetRect
            ? Math.min(
                window.innerWidth - 440,
                Math.max(20, targetRect.left)
              )
            : '50%',
          transform: !targetRect ? 'translate(-50%, -50%)' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1b2b38] text-[#4ca6e1] flex items-center justify-center text-xs font-mono font-bold">
              {currentStepIndex + 1}
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {step.title}
            </h3>
          </div>

          <button
            type="button"
            aria-label="关闭新手引导"
            onClick={onClose}
            className="p-1 rounded text-[#949494] hover:text-white hover:bg-[#1f1f1f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4">
          <p className="text-xs text-[#d1d5db] leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Footer with Step Dots, Previous & Next Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStepIndex
                    ? 'w-4 bg-[#4ca6e1]'
                    : 'w-1.5 bg-[#333333]'
                }`}
              />
            ))}
            <span className="text-[10px] font-mono text-[#949494] ml-1">
              {currentStepIndex + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 h-8 px-3 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2e2e2e] text-xs font-medium text-[#d1d5db] transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>上一步</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 h-8 px-4 rounded bg-[#4ca6e1] hover:bg-[#3d91c7] active:bg-[#327fae] text-xs font-bold text-black transition-colors"
            >
              <span>{isLast ? '完成引导' : '下一步'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
