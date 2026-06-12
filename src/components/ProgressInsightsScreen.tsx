import { useState } from 'react';
import { Sparkles, Moon, TrendingUp, Users, CircleAlert } from 'lucide-react';
import type { GuidanceItem } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface ProgressInsightsScreenProps {
  onBack: () => void;
  onNavigateHome: () => void;
  onRematch?: () => void;
  onAdjustSchedule?: () => void;
  onContinue?: () => void;
  guidanceData?: GuidanceItem[];
}

export default function ProgressInsightsScreen({ onBack, onNavigateHome, onRematch, onAdjustSchedule, onContinue, guidanceData }: ProgressInsightsScreenProps) {
  const [selectedFeed, setSelectedFeed] = useState<number>(0);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon': return Moon;
      case 'TrendingUp': return TrendingUp;
      default: return Users;
    }
  };
  const displayedGuidance = (guidanceData || []).map((item) => ({
    icon: item.type === 'activity' ? 'Moon' : item.type === 'attendance' ? 'TrendingUp' : 'Users',
    title: item.actionLabel,
    description: item.message
  }));

  return (
    <div className="flex flex-col min-h-screen bg-brand-background text-brand-on-background pb-12 w-full">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
        </div>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-[1120px] grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-12">
        {/* Page Title */}
        <div className="flex flex-col items-start px-1 lg:col-span-12">
          <h1 className="font-sans font-extrabold text-2xl text-brand-on-surface leading-tight">
            Progress Insights
          </h1>
          <p className="font-sans text-brand-on-surface-variant text-xs sm:text-sm mt-2 leading-relaxed">
            Personalized feedback based on your recent activity.
          </p>
        </div>

        {/* Data-derived guidance container */}
        <div className="bg-[#f3ebff] border border-[#d0bcff]/40 rounded-3xl p-6 flex flex-col shadow-xs lg:col-span-8 lg:row-span-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-purple-200/30 mb-5 relative">
            <div className="w-8 h-8 rounded-full bg-[#8455ef]/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-brand-secondary" />
            </div>
            <h3 className="font-sans font-extrabold text-base text-brand-secondary">Activity Guidance</h3>
            
            {/* Soft circle matching mockup corner */}
            <div className="absolute right-0 top-0.5 w-8 h-8 rounded-full bg-purple-200/30 shrink-0" />
          </div>

          {/* List of Feedback blocks */}
          <div className="flex flex-col gap-3.5">
            {displayedGuidance.map((item, index) => {
              const Icon = getIcon(item.icon);
              const isSelected = selectedFeed === index;
              return (
                <div 
                  key={index}
                  onClick={() => setSelectedFeed(index)}
                  className={`bg-white border text-brand-on-surface rounded-2xl p-4.5 flex gap-3.5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#8455ef] ring-2 ring-[#e9ddff]/40 shadow-xs scale-[1.01]' 
                      : 'border-transparent hover:border-brand-outline-variant/40 hover:bg-brand-surface-low'
                  }`}
                >
                  <div className="text-[#8455ef] w-5 h-5 mt-0.5 shrink-0">
                    <Icon className="w-5 h-5 text-[#8455ef]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-brand-on-surface">{item.title}</h4>
                    <p className="text-xs text-brand-on-surface-variant font-medium mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
            {!displayedGuidance.length && (
              <p className="rounded-2xl bg-white p-5 text-xs font-semibold text-brand-on-surface-variant">Complete study activity to generate guidance.</p>
            )}
          </div>

          {/* Separator inside purple container */}
          <div className="h-px bg-purple-200/35 w-full my-6" />

          {/* Actions that perform real workflows */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={onRematch}
                className="py-3 px-3 bg-white border border-brand-primary text-brand-primary text-xs font-bold rounded-xl hover:bg-brand-surface-low active:bg-brand-surface-container transition-all cursor-pointer text-center"
              >
                Rematch
              </button>

              <button
                onClick={onAdjustSchedule || onBack}
                className="py-3 px-3 bg-white border border-brand-outline-variant text-brand-on-surface-variant text-xs font-bold rounded-xl hover:bg-brand-surface-low active:bg-brand-surface-container transition-all cursor-pointer text-center"
              >
                Adjust Schedule
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onContinue || onBack}
          className="w-full py-4 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-primary-container transition-all cursor-pointer lg:col-span-4 lg:self-end"
        >
          Continue
        </button>

        {/* Guidance source */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-3xs flex flex-col gap-2.5 lg:col-span-4 lg:self-start">
          <div className="flex items-center gap-1.5 text-brand-outline font-extrabold text-[10px] uppercase tracking-widest px-0.5">
            <CircleAlert className="w-3.5 h-3.5 text-brand-outline shrink-0" />
            <span>GUIDANCE SOURCE</span>
          </div>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-brand-on-surface-variant">
            These messages are calculated from your saved profile, active groups, sessions, and attendance records.
          </p>
        </div>
      </div>
    </div>
  );
}
