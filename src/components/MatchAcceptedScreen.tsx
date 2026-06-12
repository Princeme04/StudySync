import React from 'react';
import { Check, Users, MessageSquare, Flag, Info } from 'lucide-react';
import type { StudyMatch } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface MatchAcceptedScreenProps {
  onBack: () => void;
  onNavigateHome: () => void;
  onStartChat: () => void;
  onConfirmGoal: () => Promise<void> | void;
  currentUserName: string;
  acceptedMatch: StudyMatch | null;
}

export default function MatchAcceptedScreen({ onBack, onNavigateHome, onStartChat, onConfirmGoal, currentUserName, acceptedMatch }: MatchAcceptedScreenProps) {
  const members = [currentUserName, acceptedMatch?.candidateName].filter(Boolean) as string[];
  return (
    <div className="flex min-h-screen w-full flex-col bg-brand-background">
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[860px] flex flex-col items-center">
        {/* Confirmed Checked Icon badge matching Image 5 */}
        <div className="w-18 h-18 rounded-full bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 mb-6">
          <Check className="w-9 h-9 text-white stroke-[3px]" />
        </div>

        {/* Header Texts */}
        <h1 className="font-sans font-extrabold text-3xl text-brand-primary text-center tracking-tight leading-tight mb-2">
          Match Accepted!
        </h1>
        <p className="font-sans text-brand-on-surface-variant text-center text-sm leading-relaxed px-4 mb-8">
          You're now part of a study group. Get ready to crush your goals together.
        </p>

        {/* Group Structure Cards */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-md border border-gray-100/80 mb-6 flex flex-col lg:p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col">
              <h2 className="font-sans font-bold text-lg text-brand-on-surface leading-tight">
                {acceptedMatch?.course || 'Study Group'}
              </h2>
              <div className="flex items-center gap-1.5 text-brand-primary mt-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-semibold">Study Squad</span>
              </div>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-brand-secondary-container/15 text-brand-secondary text-[11px] font-bold">
              {members.length} Members
            </span>
          </div>

          {/* Separator */}
          <div className="h-px bg-gray-100 w-full my-1" />

          {/* Members list */}
          <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
            {members.map((member) => (
              <div key={member} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-150 bg-brand-surface-container text-xs font-black text-brand-primary">
                  {member.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-brand-on-surface truncate">{member}</p>
                    {member === currentUserName && (
                      <span className="px-1.5 py-0.5 rounded bg-brand-surface-container text-brand-primary text-[9px] font-bold">
                        (You)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-on-surface-variant font-medium">{member === currentUserName ? 'You' : 'Accepted match'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="grid grid-cols-1 gap-3 w-full mb-8 sm:grid-cols-2">
          <button
            onClick={onStartChat}
            className="w-full py-4 bg-brand-primary text-white font-semibold text-sm rounded-xl hover:bg-brand-primary-container hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Start Group Chat</span>
          </button>
          
          <button
            onClick={onConfirmGoal}
            className="w-full py-4 bg-white border border-brand-primary text-brand-primary font-semibold text-sm rounded-xl hover:bg-brand-surface-low hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flag className="w-4 h-4" />
            <span>Accept Goal & View Session</span>
          </button>
        </div>

        <div className="w-full bg-[#ecf2ff] rounded-xl p-3 px-4 flex items-center text-brand-primary border border-brand-surface-container-high/40">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-brand-primary shrink-0" />
            <span className="text-[11px] font-semibold text-brand-on-surface-variant font-sans">
              This connection includes <span className="font-extrabold text-brand-primary">{members.length}</span> confirmed members.
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
