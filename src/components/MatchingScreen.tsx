import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import HeaderNavigation from './HeaderNavigation';

interface MatchingScreenProps {
  onComplete: () => Promise<void> | void;
  onBack: () => void;
  onNavigateHome: () => void;
}

export default function MatchingScreen({ onComplete, onBack, onNavigateHome }: MatchingScreenProps) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void onComplete();
  }, [onComplete]);

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="w-full max-w-[620px] rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-primary" />
          <h1 className="mt-5 text-2xl font-extrabold text-brand-on-surface">Finding compatible study partners</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-on-surface-variant">
            StudySync is comparing saved course, schedule, goal, learning style, and group preferences.
          </p>
        </section>
      </main>
    </div>
  );
}
