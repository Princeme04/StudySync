import { ArrowRight, Bell, ClipboardCheck, Sparkles, Users } from 'lucide-react';
import type { AccountabilityRecord } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface ActivityDashboardScreenProps {
  onBack: () => void;
  onNavigateHome: () => void;
  onNavigateToProgress: () => void;
  accountability?: AccountabilityRecord | null;
  groupMembers: string[];
  currentUserName: string;
}

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function ActivityDashboardScreen({
  onBack,
  onNavigateHome,
  onNavigateToProgress,
  accountability,
  groupMembers,
  currentUserName
}: ActivityDashboardScreenProps) {
  const attentionMember = groupMembers.find((member) => member !== currentUserName) || groupMembers[0] || 'Group member';
  const inactiveRate = accountability?.isInactive ? 50 : 0;

  return (
    <div className="flex min-h-screen w-full flex-col bg-brand-background pb-12 text-brand-on-background">
      <header className="flex flex-col gap-4 border-b border-gray-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} context={<span className="hidden items-center gap-1 rounded-full bg-[#e9ddff] px-2.5 py-1 text-xs font-bold text-brand-secondary lg:flex">
          <Sparkles className="h-3.5 w-3.5" />
          Group Insights
        </span>} />
      </header>

      <main className="mx-auto mt-6 grid w-full max-w-[1180px] grid-cols-1 gap-5 px-4 sm:px-6 lg:grid-cols-12">
        <section className="px-1 lg:col-span-12">
          <h1 className="text-2xl font-extrabold leading-tight text-brand-on-surface">Activity Dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-on-surface-variant">
            Accountability tracking for your current study group.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:col-span-12 lg:max-w-[520px]">
          <div className="flex flex-col rounded-2xl bg-[#004ac6] p-4 text-white shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-on-primary-container/85">Participation Rate</span>
            <span className="mt-2 font-mono text-2xl font-black">{accountability?.participationScore ?? 0}%</span>
          </div>
          <div className="flex flex-col rounded-2xl border border-red-200/40 bg-[#ffdad6] p-4 text-[#ba1a1a] shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#93000a]/80">Inactive Rate</span>
            <span className="mt-2 font-mono text-2xl font-black">{inactiveRate}%</span>
          </div>
        </section>

        <section className="mt-2 flex flex-col gap-2.5 lg:col-span-7">
          <div className="flex items-center gap-2 px-1 text-xs font-extrabold text-brand-on-surface">
            <Bell className="h-4 w-4 text-brand-error" />
            Needs Attention
          </div>
          <article className="rounded-3xl border-y border-r border-gray-150 border-l-4 border-brand-error bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border-2 border-brand-surface-container bg-brand-surface-container text-sm font-black text-brand-primary">
                {initials(attentionMember)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-brand-on-surface">{attentionMember}</h3>
                  <span className="rounded bg-brand-error-container px-2 py-0.5 text-[9px] font-bold text-brand-error">Needs follow-up</span>
                </div>
                <p className="mt-2 text-xs font-medium leading-relaxed text-[#434655]">
                  {accountability?.suggestedAction || 'Review attendance and participation before the next session.'}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-2 flex flex-col gap-2.5 lg:col-span-5">
          <div className="flex items-center gap-2 px-1 text-xs font-extrabold text-brand-on-surface">
            <ClipboardCheck className="h-4 w-4 text-[#8455ef]" />
            Accountability Summary
          </div>
          <article className="rounded-3xl border border-[#d0bcff]/40 bg-[#f3ebff] p-6 shadow-xs">
            <h3 className="text-base font-extrabold text-brand-secondary">Recorded Group Activity</h3>
            <p className="mt-2.5 text-xs font-medium leading-relaxed text-brand-on-surface-variant">
              Participation score: {accountability?.participationScore ?? 0}%. Attendance rate: {accountability?.attendanceRate ?? 0}%.
            </p>
          </article>
        </section>

        <section className="mt-2 flex flex-col gap-3 lg:col-span-12">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-brand-on-surface">
            <Users className="h-4 w-4 text-brand-primary" />
            Group Members
          </div>
          {groupMembers.map((member) => (
            <div key={member} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-3xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dee8ff] text-xs font-bold text-brand-primary">{initials(member)}</span>
                <div>
                  <h4 className="text-xs font-extrabold text-brand-on-surface">{member}</h4>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-green-600">Member</p>
                </div>
              </div>
            </div>
          ))}
          {!groupMembers.length && <p className="rounded-2xl bg-white p-6 text-center text-xs font-semibold text-brand-on-surface-variant">No group members loaded.</p>}
        </section>

        <button type="button" onClick={onNavigateToProgress} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-outline-variant bg-[#f0f3ff] py-4 text-xs font-bold text-brand-primary shadow-3xs transition-colors hover:border-brand-primary cursor-pointer sm:text-sm lg:col-span-12 lg:mx-auto lg:max-w-[440px]">
          Proceed to Progress
          <ArrowRight className="h-4 w-4" />
        </button>
      </main>
    </div>
  );
}
