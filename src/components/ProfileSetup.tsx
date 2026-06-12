import React, { useState } from 'react';
import { 
  GraduationCap, Flag, Brain, Clock, ChevronDown,
  User, Users, UserSquare2, Sun, Moon, ArrowRight, Lock 
} from 'lucide-react';
import { StudentProfile } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface ProfileSetupProps {
  initialProfile: StudentProfile;
  onComplete: (updatedProfile: StudentProfile) => void;
  onBack: () => void;
  onNavigateHome: () => void;
}

export default function ProfileSetup({ initialProfile, onComplete, onBack, onNavigateHome }: ProfileSetupProps) {
  const [profile, setProfile] = useState<StudentProfile>({ ...initialProfile });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Hardcoded study goal choices for selector
  const studyGoals = [
    'Score 90%+ on next week\'s midterm',
    'Understand fundamental programming motifs',
    'Prepare for medical board entrance examinations',
    'Review key formulas and homework sets'
  ];

  const handleToggleStyle = (style: string) => {
    const styles = profile.learningStyles.includes(style)
      ? profile.learningStyles.filter((s) => s !== style)
      : [...profile.learningStyles, style];
    setProfile({ ...profile, learningStyles: styles });
  };

  const handleToggleTime = (time: string) => {
    const times = profile.timeOfDay.includes(time)
      ? profile.timeOfDay.filter((t) => t !== time)
      : [...profile.timeOfDay, time];
    setProfile({ ...profile, timeOfDay: times });
  };

  const handleContinue = () => {
    onComplete(profile);
  };
  const isValid = Boolean(profile.university.trim() && profile.major.trim() && profile.studyGoal.trim() && profile.learningStyles.length && profile.timeOfDay.length);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start bg-brand-background">
      <div className="w-full border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>
      <div className="flex w-full max-w-[1120px] flex-col gap-6 px-4 py-8 sm:px-6">

        {/* Step indicator header */}
        <div className="flex justify-between items-end w-full px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-primary tracking-widest uppercase">
              PROFILE SETUP
            </span>
            <h1 className="font-sans font-bold text-2xl text-brand-on-surface mt-1 leading-tight">
              Tell us about your studies
            </h1>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs text-brand-on-surface-variant font-medium">Step 1 of 3</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div className="h-full w-1/3 bg-brand-primary rounded-full" />
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Section 1: Academic Background */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 lg:row-span-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
              <GraduationCap className="w-5 h-5 text-brand-primary" />
              <h3 className="font-sans font-bold text-base text-brand-on-surface">Academic Background</h3>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-brand-on-surface-variant">University / Class</label>
              <input
                type="text"
                placeholder="e.g. Stanford University, CS101"
                value={profile.university}
                onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                className="w-full px-4 py-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-xl text-sm text-brand-on-surface placeholder:text-brand-outline focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-brand-on-surface-variant">Major Course / Subject</label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Calculus"
                value={profile.major}
                onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                className="w-full px-4 py-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-xl text-sm text-brand-on-surface placeholder:text-brand-outline focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          {/* Section 2: Primary Study Goal */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3 relative">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
              <Flag className="w-5 h-5 text-brand-primary" />
              <h3 className="font-sans font-bold text-base text-brand-on-surface">Primary Study Goal</h3>
            </div>
            <p className="text-xs text-brand-on-surface-variant font-medium">What are you working towards?</p>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-xl text-sm text-brand-on-surface flex items-center justify-between hover:border-brand-primary focus:outline-none transition-all cursor-pointer"
              >
                <span className="truncate">{profile.studyGoal || 'Select a goal...'}</span>
                <ChevronDown className={`w-4 h-4 text-brand-outline transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-brand-outline-variant rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                  {studyGoals.map((goal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfile({ ...profile, studyGoal: goal });
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-brand-surface-container text-brand-on-surface transition-colors"
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Learning Style */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
              <Brain className="w-5 h-5 text-brand-primary" />
              <h3 className="font-sans font-bold text-base text-brand-on-surface">Learning Style</h3>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-1">
              {['Visual', 'Auditory', 'Reading', 'Kinesthetic'].map((style) => {
                const active = profile.learningStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleToggleStyle(style)}
                    className={`px-4.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-brand-primary border-brand-primary text-white shadow-xs'
                        : 'bg-white border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface-low'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Availability & Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
              <Clock className="w-5 h-5 text-brand-primary" />
              <h3 className="font-sans font-bold text-base text-brand-on-surface">Availability & Preferences</h3>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-brand-on-surface-variant">Study Preference</span>
              <div className="grid grid-cols-3 gap-3.5 mt-1">
                {[
                  { value: 'solo', label: 'Solo Focus', icon: User },
                  { value: 'pair', label: 'Pair (1-on-1)', icon: Users },
                  { value: 'group', label: 'Study Group', icon: UserSquare2 }
                ].map((pref) => {
                  const active = profile.studyPreference === pref.value;
                  const Icon = pref.icon;
                  return (
                    <button
                      key={pref.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, studyPreference: pref.value as any })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        active
                          ? 'border-brand-primary bg-brand-surface-container/30 text-brand-primary shadow-xs'
                          : 'border-brand-outline-variant bg-white text-brand-on-surface-variant hover:bg-brand-surface-low hover:border-brand-outline'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2.5" />
                      <span className="text-[10px] sm:text-xs font-bold text-center leading-tight">
                        {pref.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-brand-on-surface-variant">Preferred Time of Day</span>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { value: 'Morning', icon: Sun, style: 'active:bg-amber-100 text-amber-700' },
                  { value: 'Afternoon', icon: Sun, style: 'active:bg-purple-100 text-brand-secondary bg-brand-secondary-container/10 border-brand-secondary' }, // Purple highlighting matching Image 2
                  { value: 'Evening', icon: Moon, style: 'active:bg-indigo-100 text-indigo-700' }
                ].map((time) => {
                  const active = profile.timeOfDay.includes(time.value);
                  const Icon = time.icon;
                  return (
                    <button
                      key={time.value}
                      type="button"
                      onClick={() => handleToggleTime(time.value)}
                      className={`inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-[#e9ddff] border-[#8455ef] text-[#6b38d4] shadow-xs' // Soft Purple highlighting exactly like Afternoon in image
                          : 'bg-white border-brand-outline-variant text-[#434655] hover:bg-brand-surface-low'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{time.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="ml-auto flex w-full flex-col gap-4 mt-4 pb-8 lg:max-w-[420px]">
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className="w-full py-4 bg-brand-primary text-white font-semibold text-sm rounded-xl hover:bg-brand-primary-container hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-md disabled:cursor-not-allowed disabled:opacity-45 disabled:translate-y-0"
          >
            <span>Continue to Matching</span>
            <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center justify-center gap-1.5 text-brand-outline text-[10px] uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-brand-outline shrink-0" />
            <span>Your data is securely used only to find matches.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
