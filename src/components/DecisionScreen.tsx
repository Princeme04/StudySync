import { Home, Pause, RefreshCw, Sparkles } from 'lucide-react';
import HeaderNavigation from './HeaderNavigation';

interface DecisionScreenProps {
  paused: boolean;
  onBack: () => void;
  onNavigateHome: () => void;
  onContinue: () => void;
  onRematch: () => void;
  onPause: () => void;
}

export default function DecisionScreen({ paused, onBack, onNavigateHome, onContinue, onRematch, onPause }: DecisionScreenProps) {
  return (
    <div className="min-h-screen bg-brand-background">
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>
      <div className="px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="mb-6 flex items-center gap-2 rounded-lg border border-brand-outline-variant bg-white px-4 py-2.5 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-surface-low cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard Home
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Next Step</span>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-on-surface">Choose how to continue</h1>
          <p className="mt-2 text-sm text-brand-on-surface-variant">Your progress is saved. Choose the next action for your study activity.</p>
        </div>
        {paused && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 lg:col-span-3">Activity paused. Your group and progress remain saved.</div>}
        <button onClick={onContinue} className="flex min-h-36 items-start gap-3 rounded-2xl bg-brand-primary p-6 text-left text-white shadow-sm">
          <Sparkles className="h-5 w-5" /><span><strong className="block">Continue Studying</strong><small>Review plans and Pro tools</small></span>
        </button>
        <button onClick={onRematch} className="flex min-h-36 items-start gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-left text-brand-on-surface shadow-sm">
          <RefreshCw className="h-5 w-5 text-brand-primary" /><span><strong className="block">Find New Match</strong><small className="text-brand-on-surface-variant">Generate a new compatible match list</small></span>
        </button>
        <button onClick={onPause} className="flex min-h-36 items-start gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-left text-brand-on-surface shadow-sm">
          <Pause className="h-5 w-5 text-brand-error" /><span><strong className="block">Pause Activity</strong><small className="text-brand-on-surface-variant">Keep data while pausing engagement</small></span>
        </button>
      </div>
      </div>
    </div>
  );
}
