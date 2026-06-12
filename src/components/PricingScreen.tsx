import { Check, CircleAlert } from 'lucide-react';
import HeaderNavigation from './HeaderNavigation';

interface PricingScreenProps {
  onBack: () => void;
  onNavigateHome: () => void;
  onContinueFree?: () => void;
}

const plannedFeatures = [
  'Unlimited compatibility matching',
  'Expanded progress reports',
  'Priority scheduling tools',
  'Additional group coordination features'
];

export default function PricingScreen({ onBack, onNavigateHome, onContinueFree }: PricingScreenProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-brand-background pb-12 text-brand-on-background">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>

      <main className="mx-auto mt-10 grid w-full max-w-[860px] grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <CircleAlert className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-brand-on-surface">Subscriptions are not available yet</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-on-surface-variant">
                StudySync does not collect payments or activate paid access until a production billing provider and refund workflow are connected.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-extrabold text-brand-on-surface">Planned paid features</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {plannedFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-xs font-semibold text-brand-on-surface-variant">
                <Check className="h-4 w-4 shrink-0 text-brand-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={onContinueFree || onBack}
          className="rounded-xl bg-brand-primary px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-brand-primary-container lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-[420px]"
        >
          Continue with Free
        </button>
      </main>
    </div>
  );
}
