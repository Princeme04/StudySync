import React, { useState } from 'react';
import { ArrowLeft, Edit2, Sliders, Video, MapPin, Repeat2, Sparkles } from 'lucide-react';
import HeaderNavigation from './HeaderNavigation';

interface CreateGroupScreenProps {
  onBack: () => void;
  onGroupSetupDone: (groupData: { name: string; purpose: string; meetingStyle: string; targetGoal: string; rules: string[] }) => void;
  onNavigateHome: () => void;
}

export default function CreateGroupScreen({ onBack, onGroupSetupDone, onNavigateHome }: CreateGroupScreenProps) {
  const [groupName, setGroupName] = useState('');
  const [purpose, setPurpose] = useState('Exam Prep');
  const [meetingStyle, setMeetingStyle] = useState('Hybrid');
  const [targetGoal, setTargetGoal] = useState('');
  const [rules, setRules] = useState(
    "1. Come prepared with questions.\n2. Be respectful of everyone's time.\n3. Share resources."
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGroupSetupDone({
      name: groupName.trim(),
      purpose,
      meetingStyle,
      targetGoal: targetGoal.trim(),
      rules: rules.split('\n').map((rule) => rule.trim()).filter(Boolean)
    });
  };

  const handleSuggestRules = () => {
    setRules(
      "1. Come prepared with questions.\n2. Be respectful of everyone's time.\n3. Share resources.\n4. Follow up on asynchronous tasks.\n5. Keep conversation positive & supportive."
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-background text-brand-on-background pb-12 w-full">
      {/* Header with back */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} context={<span className="hidden text-xs text-brand-outline font-semibold lg:inline">Setup Mode</span>} />
      </div>

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 mt-8 w-full flex flex-col gap-6">
        <div className="text-center mb-1">
          <h1 className="font-sans font-extrabold text-2xl text-brand-on-surface">
            Set Up Study Group
          </h1>
          <p className="font-sans text-brand-on-surface-variant text-xs sm:text-sm mt-2 leading-relaxed px-4">
            Define your group's identity and goals to attract the right members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Card 1: Group Identity */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-50">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Edit2 className="w-4 h-4 text-brand-primary" />
              </div>
              <h3 className="font-sans font-extrabold text-base text-brand-on-surface">Group Identity</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="group-name" className="text-xs font-bold text-brand-on-surface-variant">Group Name</label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-xl text-sm text-brand-on-surface focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-on-surface-variant">Primary Purpose</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {['Exam Prep', 'Assignment Discussion', 'Weekly Session', 'Certification'].map((p) => {
                  const active = purpose === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurpose(p)}
                      className={`py-2 px-3 rounded-xl border font-bold text-center text-xs transition-all duration-150 cursor-pointer ${
                        active
                          ? 'bg-brand-primary border-brand-primary text-white shadow-xs'
                          : 'border-brand-outline-variant text-[11px] sm:text-xs text-brand-on-surface-variant hover:bg-brand-surface-low'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Logistics & Targets */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-50">
              <div className="w-8 h-8 rounded-full bg-brand-secondary-container/10 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-[#8455ef]" />
              </div>
              <h3 className="font-sans font-extrabold text-base text-brand-on-surface">Logistics & Targets</h3>
            </div>

            {/* Meeting style selectors */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-brand-on-surface-variant">Meeting Style</span>
              <div className="grid grid-cols-3 gap-3.5 mt-1">
                {[
                  { value: 'Online', icon: Video, label: 'Online' },
                  { value: 'Offline', icon: MapPin, label: 'Offline' },
                  { value: 'Hybrid', icon: Repeat2, label: 'Hybrid' }
                ].map((style) => {
                  const active = meetingStyle === style.value;
                  const Icon = style.icon;
                  return (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setMeetingStyle(style.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        active
                          ? 'border-brand-secondary bg-[#e9ddff]/35 text-[#6b38d4] shadow-xs' // Soft Purple highlighting exactly like Hybrid in image
                          : 'border-brand-outline-variant bg-white text-brand-on-surface-variant hover:bg-brand-surface-low hover:border-brand-outline'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 mb-2 text-current" />
                      <span className="text-[10px] font-bold">{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Study Target */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="group-target" className="text-xs font-bold text-brand-on-surface-variant">Study Target (Goal)</label>
              <input
                id="group-target"
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="Goal"
                className="w-full px-4 py-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-xl text-sm text-brand-on-surface focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>

            {/* Group Rules */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="group-rules" className="text-xs font-bold text-brand-on-surface-variant">Group Rules</label>
              <textarea
                id="group-rules"
                rows={3.5}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Rules"
                className="w-full px-4 py-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-xl text-xs text-brand-on-surface focus:outline-none focus:border-brand-primary transition-all leading-relaxed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!groupName.trim() || !targetGoal.trim()}
            className="w-full py-4 mt-1 bg-brand-primary text-white font-semibold text-sm rounded-xl hover:bg-brand-primary-container hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed disabled:opacity-45 lg:col-span-2 lg:mx-auto lg:max-w-[420px]"
          >
            <span>Set Group Plan</span>
            <ArrowLeft className="w-4.5 h-4.5 rotate-180" />
          </button>
        </form>

        {/* Rule template */}
        <div className="bg-[#f0f3ff] border border-blue-100 rounded-3xl p-6 flex flex-col gap-3">
          <h4 className="text-sm font-extrabold text-[#0053db] font-sans">Group rule template</h4>
          <p className="text-xs text-brand-on-surface-variant leading-relaxed font-sans">
            Start with a clear rule template, then edit it to fit this {purpose.toLowerCase()} group.
          </p>
          <button 
            type="button"
            onClick={handleSuggestRules}
            className="inline-flex self-start items-center gap-1 px-1.5 py-0.5 mt-1 border-none bg-transparent text-brand-secondary text-xs font-bold hover:underline transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use detailed rule template</span>
          </button>
        </div>
      </div>
    </div>
  );
}
