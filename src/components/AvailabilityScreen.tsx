import { Calendar, Check, Clock, RefreshCw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ScheduleSuggestion } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface AvailabilityScreenProps {
  groupName: string;
  groupMembers: string[];
  suggestions: ScheduleSuggestion[];
  onBack: () => void;
  onScheduleConfirmed: (slot: { date: string; time: string }) => void;
  onNavigateHome: () => void;
}

const formatDate = (date: string) => new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).format(new Date(`${date}T12:00:00`));

export default function AvailabilityScreen({
  groupName,
  groupMembers,
  suggestions,
  onBack,
  onScheduleConfirmed,
  onNavigateHome
}: AvailabilityScreenProps) {
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!selectedId && suggestions[0]) setSelectedId(suggestions[0].id);
  }, [selectedId, suggestions]);

  const selected = suggestions.find((item) => item.id === selectedId) || suggestions[0];

  return (
    <div className="min-h-screen bg-brand-background pb-12 text-brand-on-background">
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} context={<span className="hidden rounded-full bg-brand-secondary-container/10 px-3 py-1 text-xs font-bold text-brand-secondary lg:inline">
          Availability suggestions
        </span>} />
      </header>

      <main className="mx-auto grid w-full max-w-[1080px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12">
        <section className="lg:col-span-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Schedule a session</span>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-on-surface">{groupName}</h1>
          <p className="mt-2 text-sm text-brand-on-surface-variant">
            Select a future time generated from the group&apos;s shared availability.
          </p>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Calendar className="h-5 w-5 text-brand-primary" />
            <h2 className="text-sm font-extrabold text-brand-on-surface">Suggested times</h2>
          </div>

          {suggestions.length ? (
            <div className="mt-5 flex flex-col gap-3">
              {suggestions.map((slot) => {
                const active = slot.id === selected?.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedId(slot.id)}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors cursor-pointer ${active ? 'border-brand-primary bg-[#e9efff]' : 'border-gray-100 hover:bg-brand-surface-low'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${active ? 'bg-brand-primary text-white' : 'bg-brand-surface-container text-brand-primary'}`}>
                      {active ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-brand-on-surface">{formatDate(slot.date)}</span>
                      <span className="mt-1 block text-xs font-semibold text-brand-on-surface-variant">{slot.time}</span>
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-brand-primary">
                      {slot.availability}% available
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" />
              <p className="mt-3 text-xs font-bold text-brand-on-surface-variant">Generating future availability suggestions...</p>
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-brand-primary/15 bg-[#e9efff] p-6 lg:col-span-5">
          <Users className="h-6 w-6 text-brand-primary" />
          <h2 className="mt-4 text-lg font-extrabold text-brand-on-surface">Group availability</h2>
          <p className="mt-2 text-xs leading-relaxed text-brand-on-surface-variant">
            Suggestions are calculated for {groupMembers.length} authenticated group member{groupMembers.length === 1 ? '' : 's'}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {groupMembers.map((member) => (
              <span key={member} className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-brand-on-surface-variant">{member}</span>
            ))}
          </div>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onScheduleConfirmed({ date: selected.date, time: selected.time })}
            className="mt-7 w-full rounded-xl bg-brand-primary px-5 py-4 text-sm font-bold text-white hover:bg-brand-primary-container disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Confirm selected time
          </button>
        </aside>
      </main>
    </div>
  );
}
