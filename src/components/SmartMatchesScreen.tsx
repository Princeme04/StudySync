import React, { useEffect, useState } from 'react';
import { Users, RefreshCw, Layers, Check, X, ArrowUpRight, Clock, Brain, Target, UserRound } from 'lucide-react';
import type { GroupRequirements, MatchOption } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface SmartMatchesScreenProps {
  onAcceptMatch: (match: MatchOption) => void;
  onNavigateToCreateGroup: () => void;
  onBack: () => void;
  onNavigateHome: () => void;
  onEditRequirements: () => void;
  requirements: GroupRequirements | null;
  matchesData?: MatchOption[];
  onRejectMatch?: (matchId: string) => void;
  onReloadMatches?: () => void;
}

export default function SmartMatchesScreen({ onAcceptMatch, onNavigateToCreateGroup, onBack, onNavigateHome, onEditRequirements, requirements, matchesData, onRejectMatch, onReloadMatches }: SmartMatchesScreenProps) {
  const [matches, setMatches] = useState<MatchOption[]>(matchesData || []);
  const [reviewMatch, setReviewMatch] = useState<MatchOption | null>(null);

  useEffect(() => {
    if (matchesData) setMatches(matchesData);
  }, [matchesData]);

  useEffect(() => {
    if (!reviewMatch) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReviewMatch(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [reviewMatch]);

  const handleAccept = (matchId: string) => {
    const selectedMatch = matches.find((m) => m.id === matchId);
    if (!selectedMatch) return;
    
    onAcceptMatch(selectedMatch);
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  };

  const handlePass = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    onRejectMatch?.(matchId);
  };

  const handleReset = () => {
    if (onReloadMatches) onReloadMatches();
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-background text-brand-on-background pb-12 w-full">
      {/* Upper bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>

      {/* Hero section */}
      <div className="mx-auto mt-8 flex w-full max-w-[1180px] flex-col px-4 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-sans font-extrabold text-2xl lg:text-3xl text-brand-on-surface text-center sm:text-left">
              Smart Matches
            </h1>
            <p className="font-sans text-brand-on-surface-variant text-center sm:text-left text-xs sm:text-sm mt-2 leading-relaxed">
              Compatibility-ranked study partners based on your courses, goals, and learning style.
            </p>
          </div>
          <button
            onClick={onNavigateToCreateGroup}
            className="flex shrink-0 items-center justify-center gap-1 rounded-lg bg-brand-primary px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-brand-primary-container cursor-pointer sm:min-w-[190px]"
          >
            <span>Set Up Study Group</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {requirements && (
          <div className="mt-6 rounded-2xl border border-brand-primary/15 bg-[#e9efff] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Your group requirements</p>
                <h2 className="mt-1 text-base font-extrabold text-brand-on-surface">{requirements.course}</h2>
                <p className="mt-1 text-xs text-brand-on-surface-variant">{requirements.studyGoal}</p>
              </div>
              <button type="button" onClick={onEditRequirements} className="self-start rounded-lg border border-brand-primary bg-white px-4 py-2.5 text-xs font-bold text-brand-primary hover:bg-brand-surface-low cursor-pointer">
                Edit requirements
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[requirements.preferredTime, requirements.learningStyle, requirements.studyPreference, requirements.groupSize].map((value) => (
                <span key={value} className="rounded-full border border-white bg-white px-3 py-1.5 text-[10px] font-bold capitalize text-brand-on-surface-variant">{value}</span>
              ))}
              {requirements.notes && <span className="rounded-full border border-white bg-white px-3 py-1.5 text-[10px] font-bold text-brand-on-surface-variant">{requirements.notes}</span>}
            </div>
          </div>
        )}

        {/* Matches Section */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {matches.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-100 rounded-3xl p-8 py-10 shadow-sm flex flex-col items-center justify-center text-center">
              <Layers className="w-10 h-10 text-brand-outline opacity-40 mb-3" />
              <p className="text-sm font-bold text-brand-on-surface">No more matches left!</p>
              <p className="text-xs text-brand-on-surface-variant font-medium mt-1">
                You can restore the default matches to check out others.
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-4.5 py-2 border border-brand-outline-variant text-brand-primary text-xs font-bold rounded-lg hover:bg-brand-surface-low transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Matches</span>
              </button>
            </div>
          ) : (
            matches.map((item) => (
              <div 
                key={item.id}
                className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex h-full flex-col relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Header info */}
                <div className="flex items-start gap-3.5">
                  {/* Photo or icon layout */}
                  {item.type === 'individual' && item.avatarUrl ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shrink-0">
                      <img 
                        src={item.avatarUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-surface-container flex items-center justify-center text-brand-primary shrink-0">
                      {item.type === 'individual'
                        ? <span className="text-xs font-black">{item.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                        : <Users className="w-5 h-5 text-brand-primary" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-brand-on-surface truncate">{item.name}</h3>
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-brand-secondary-container/15 text-brand-secondary text-[9px] font-bold shrink-0">
                        {item.type === 'group' ? 'Open group' : `${item.matchPercentage}% Match`}
                      </span>
                    </div>

                    <p className="text-xs text-brand-on-surface-variant font-medium mt-0.5 font-mono">
                      {item.course} • {item.subject}
                    </p>
                  </div>
                </div>

                {/* Tag lines */}
                <div className="flex flex-wrap gap-2 mt-4.5">
                  {item.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-surface-low border border-gray-100 text-[10px] font-semibold text-brand-on-surface-variant"
                    >
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setReviewMatch(item)}
                  className="mt-4 text-left text-xs font-bold text-brand-primary hover:underline"
                >
                  Review details for {item.name}
                </button>

                {/* Form separating divider */}
                <div className="mb-4.5 mt-4 h-px w-full bg-gray-100" />

                {/* Decision Actions matching block exactly */}
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAccept(item.id);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-container transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>{item.type === 'group' ? 'Join Group' : 'Accept'}</span>
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePass(item.id);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 border border-brand-outline hover:bg-brand-surface-low text-brand-on-surface-variant text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 text-brand-outline" />
                    <span>{item.type === 'group' ? 'Hide' : 'Pass'}</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {matches.length > 0 && (
            <button
              onClick={handleReset}
              className="col-span-full mt-2 py-3 px-4 border border-brand-outline-variant bg-white text-brand-on-surface-variant font-bold text-xs rounded-xl hover:bg-brand-surface-low transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load More Matches</span>
            </button>
          )}
        </div>
      </div>

      {reviewMatch && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111c2d]/55 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setReviewMatch(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-review-title"
            className="max-h-[calc(100vh-4rem)] w-full max-w-[860px] overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{reviewMatch.type === 'group' ? 'Active group review' : 'Registered candidate review'}</span>
                <h2 id="match-review-title" className="mt-1 text-2xl font-extrabold text-brand-on-surface">
                  {reviewMatch.name}
                </h2>
                <p className="mt-1 text-sm text-brand-on-surface-variant">{reviewMatch.course} · {reviewMatch.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewMatch(null)}
                aria-label="Close matched group review"
                className="flex h-9 w-9 items-center justify-center rounded-full text-brand-outline transition-colors hover:bg-brand-surface-low hover:text-brand-on-surface cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12">
              <div className="flex flex-col gap-5 lg:col-span-7">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <DetailTile icon={Clock} label="Study time" value={reviewMatch.tags[0] || 'Evening'} />
                  <DetailTile icon={Brain} label="Study style" value={reviewMatch.tags[1] || 'Mixed'} />
                  <DetailTile icon={Users} label="Preference" value={reviewMatch.tags[2] || 'Group'} />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-brand-surface-low p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-brand-on-surface">
                    <Target className="h-4 w-4 text-brand-primary" />
                    Shared study goal
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-brand-on-surface-variant">{reviewMatch.subject}</p>
                  <p className="mt-3 rounded-xl bg-white px-4 py-3 text-xs font-semibold leading-relaxed text-brand-on-surface-variant">
                    {reviewMatch.matchReason || `This group matches your ${reviewMatch.course} focus, preferred study time, and collaboration style.`}
                  </p>
                </div>

                {requirements && (
                  <div className="rounded-2xl border border-brand-primary/15 bg-[#e9efff] p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Requirements you requested</p>
                    <p className="mt-2 text-sm font-extrabold text-brand-on-surface">{requirements.course}</p>
                    <p className="mt-1 text-xs leading-relaxed text-brand-on-surface-variant">{requirements.studyGoal}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[requirements.preferredTime, requirements.learningStyle, requirements.studyPreference, requirements.groupSize].map((value) => (
                        <span key={value} className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold capitalize text-brand-on-surface-variant">{value}</span>
                      ))}
                    </div>
                    {requirements.notes && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-[10px] font-semibold leading-relaxed text-brand-on-surface-variant">{requirements.notes}</p>}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-brand-on-surface">{reviewMatch.type === 'group' ? 'Current membership' : 'Registered candidate'}</h3>
                    <p className="mt-1 text-xs text-brand-on-surface-variant">{reviewMatch.type === 'group' ? 'Active StudySync group' : 'Verified StudySync account'}</p>
                  </div>
                  <span className="rounded-full bg-brand-secondary-container/15 px-2.5 py-1 text-[10px] font-bold text-brand-secondary">
                    {reviewMatch.type === 'group' ? `${reviewMatch.memberCount || 1} member${reviewMatch.memberCount === 1 ? '' : 's'}` : '1 user'}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <MemberRow name={reviewMatch.name} detail={reviewMatch.type === 'group' ? reviewMatch.matchReason || reviewMatch.course : `${reviewMatch.course} match`} avatarUrl={reviewMatch.avatarUrl} highlighted />
                  <p className="rounded-xl bg-brand-surface-low p-3 text-[10px] font-semibold leading-relaxed text-brand-on-surface-variant">
                    {reviewMatch.type === 'group'
                      ? 'Joining adds your registered account to this group and grants access to its group conversation.'
                      : 'Only users who registered and completed a StudySync profile can appear as matches.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end lg:col-span-12">
                <button
                  type="button"
                  onClick={() => setReviewMatch(null)}
                  className="rounded-xl border border-brand-outline-variant bg-white px-5 py-3 text-xs font-bold text-brand-on-surface-variant hover:bg-brand-surface-low cursor-pointer"
                >
                  Keep reviewing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selectedId = reviewMatch.id;
                    setReviewMatch(null);
                    handleAccept(selectedId);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-xs font-bold text-white hover:bg-brand-primary-container cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  {reviewMatch.type === 'group' ? 'Join Group' : 'Accept and join group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <Icon className="h-4 w-4 text-brand-primary" />
      <span className="mt-3 block text-[9px] font-black uppercase tracking-wider text-brand-outline">{label}</span>
      <span className="mt-1 block text-xs font-bold capitalize text-brand-on-surface">{value}</span>
    </div>
  );
}

function MemberRow({ name, detail, avatarUrl, highlighted = false }: { name: string; detail: string; avatarUrl?: string; highlighted?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 ${highlighted ? 'bg-brand-surface-container/50' : 'bg-brand-surface-low'}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full border border-gray-100 object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-primary">
          <UserRound className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-extrabold text-brand-on-surface">{name}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-brand-on-surface-variant">{detail}</p>
      </div>
      {highlighted && <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-brand-primary">Best match</span>}
    </div>
  );
}
