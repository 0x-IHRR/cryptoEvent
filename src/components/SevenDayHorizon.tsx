import React from 'react';
import { Calendar, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { HorizonDay } from '../types/activity.js';

interface SevenDayHorizonProps {
  days: HorizonDay[];
  selectedDateStr: string | null;
  onSelectDay: (dateStr: string | null) => void;
  urgentCount: number;
}

export const SevenDayHorizon: React.FC<SevenDayHorizonProps> = ({
  days,
  selectedDateStr,
  onSelectDay,
  urgentCount,
}) => {
  return (
    <section data-tour="seven-day-horizon" className="bg-[#111111] border border-[#222222] rounded p-4 mb-5">
      {/* Horizon Header & Description */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4ca6e1]" />
          <h2 className="text-sm font-semibold text-white tracking-tight">
            七日截止带 (7-Day Horizon)
          </h2>
          <span className="text-[11px] text-[#949494] hidden sm:inline">
            · 按天聚合未来 7 天截止活动，点击直达当日急迫奖池
          </span>
        </div>

        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1808] border border-[#3d3211] text-[11px] text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong>{urgentCount}</strong> 个活动已进入 72 小时倒计时
              </span>
            </div>
          )}

          {selectedDateStr && (
            <button
              type="button"
              onClick={() => onSelectDay(null)}
              className="flex items-center gap-1 text-[11px] text-[#4ca6e1] hover:text-white px-2 py-0.5 rounded bg-[#1a2e3b] border border-[#234559] transition-colors"
            >
              <span>清除日期筛选</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Horizontal Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isSelected = selectedDateStr === day.dateStr;
          const hasActivities = day.count > 0;
          const isUrgent = day.isUrgent && hasActivities;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDay(isSelected ? null : day.dateStr)}
              className={`p-2.5 rounded text-left transition-all relative flex flex-col justify-between min-h-[72px] border ${
                isSelected
                  ? 'bg-[#182a35] border-[#4ca6e1] ring-1 ring-[#4ca6e1]/40'
                  : isUrgent
                  ? 'bg-[#14120c] border-[#382b13] hover:border-[#634b1a]'
                  : 'bg-[#161616] border-[#222222] hover:border-[#333333]'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-semibold ${
                    day.isToday
                      ? 'text-[#4ca6e1]'
                      : isSelected
                      ? 'text-white'
                      : 'text-[#d1d5db]'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <span className="text-[10px] text-[#949494] font-mono">
                  {day.weekdayLabel}
                </span>
              </div>

              {/* Date & Count */}
              <div className="mt-2 flex items-baseline justify-between w-full">
                <span className="text-[10px] font-mono text-[#949494]">
                  {day.dateStr.slice(5)}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-base font-bold font-mono ${
                      day.count > 0
                        ? isUrgent
                          ? 'text-amber-400'
                          : 'text-white'
                        : 'text-[#949494]'
                    }`}
                  >
                    {day.count}
                  </span>
                  <span className="text-[10px] text-[#949494]">项</span>
                </div>
              </div>

              {/* Status Indicator */}
              {isUrgent && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
