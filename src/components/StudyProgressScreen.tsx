import { ArrowRight, Calendar, CheckCircle, Clock, Gauge, Timer, Zap } from 'lucide-react';
import type { ProgressAnalytics } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface StudyProgressScreenProps {
  onBack: () => void;
  onNavigateToInsights: () => void;
  onNavigateHome: () => void;
  analytics?: ProgressAnalytics | null;
}

export default function StudyProgressScreen({ onBack, onNavigateToInsights, onNavigateHome, analytics }: StudyProgressScreenProps) {
  const attendance = analytics?.attendanceHistory.at(-1) ?? 0;
  const metrics = [
    { label: 'Sessions completed', value: analytics?.sessionsCompleted ?? 0, icon: CheckCircle },
    { label: 'Recorded attendance', value: `${attendance}%`, icon: Calendar },
    { label: 'Consistency', value: analytics?.studyConsistency ?? 'Building', icon: Zap },
    { label: 'Preferred study time', value: analytics?.mostActiveStudyTime ?? 'Not set', icon: Clock },
    { label: 'Recorded study hours', value: analytics?.totalStudyHours ?? 0, icon: Timer },
    { label: 'Tracking coverage', value: `${analytics?.progressTrackingRate ?? 0}%`, icon: Gauge }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-brand-background pb-12 text-brand-on-background">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>

      <main className="mx-auto mt-8 w-full max-w-[1120px] px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold text-brand-on-surface">Study Progress</h1>
        <p className="mt-2 text-sm text-brand-on-surface-variant">Metrics below are calculated from your saved sessions and attendance.</p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <section key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-brand-on-surface-variant">
                <Icon className="h-4 w-4 text-brand-primary" />
                <span className="text-xs font-bold">{label}</span>
              </div>
              <p className="mt-3 text-xl font-black text-brand-primary">{value}</p>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-brand-on-surface">Activity status</h2>
          <p className="mt-2 text-sm text-brand-on-surface-variant">{analytics?.groupActivityLevel ?? 'No completed sessions'}</p>
          <button
            type="button"
            onClick={onNavigateToInsights}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-brand-primary-container"
          >
            View data-derived guidance
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </main>
    </div>
  );
}
