import { Bell, CalendarCheck, Clock, Users } from 'lucide-react';
import type { StudySession } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface SessionConfirmedScreenProps {
  session: StudySession | null;
  onBack: () => void;
  onNavigateHome: () => void;
  onViewSession: () => void;
  onReminder: () => void;
}

export default function SessionConfirmedScreen({ session, onBack, onNavigateHome, onViewSession, onReminder }: SessionConfirmedScreenProps) {
  return (
    <div className="min-h-screen bg-brand-background">
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>
      <div className="px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-[960px] grid-cols-1 items-center gap-6 lg:grid-cols-2">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <CalendarCheck className="h-16 w-16 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-extrabold text-brand-on-surface">Waiting for Session to Start</h1>
          <p className="mt-2 text-sm text-brand-on-surface-variant">You accepted the group's study goal and terms. The upcoming session is ready when the group begins.</p>
        </div></div>
        <div className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-extrabold text-brand-on-surface">{session?.topic || 'Study Session'}</h2>
          <div className="mt-5 flex flex-col gap-3 text-sm text-brand-on-surface-variant">
            <span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-brand-primary" />{session?.date || 'Session date unavailable'}</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-primary" />{session?.time || 'Session time unavailable'}</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-primary" />{session?.members.length || 0} members</span>
          </div>
        </div>
        <button onClick={onReminder} className="w-full rounded-xl border border-brand-primary bg-white py-3.5 text-sm font-bold text-brand-primary hover:bg-brand-surface-low lg:col-start-2">
          <Bell className="mr-2 inline h-4 w-4" />Activate Reminder
        </button>
        <button onClick={onViewSession} className="w-full rounded-xl bg-brand-primary py-4 text-sm font-bold text-white hover:bg-brand-primary-container lg:col-start-2">Open Waiting Session</button>
      </div>
      </div>
    </div>
  );
}
