import React from 'react';
import {
  CalendarCheck,
  Check,
  Clock,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Users
} from 'lucide-react';
import HeaderNavigation from './HeaderNavigation';

interface ProductOverviewScreenProps {
  onBack: () => void;
  onNavigateHome: () => void;
}

const productHighlights = [
  {
    icon: Users,
    title: 'Smart peer matching',
    description: 'StudySync compares profiles by course, university or class, study goals, learning style, availability, and study preference.'
  },
  {
    icon: CalendarCheck,
    title: 'Structured group setup',
    description: 'Matched students can form a group, define shared goals, choose a meeting style, and schedule sessions around real availability.'
  },
  {
    icon: LineChart,
    title: 'Accountability insights',
    description: 'The app tracks attendance, session completion, group activity, participation, consistency, and study progress over time.'
  }
];

const overviewSections = [
  {
    title: 'The Problem',
    body: 'Students often struggle to find the right study partner or group because schedules, academic goals, learning styles, and commitment levels rarely line up by chance.'
  },
  {
    title: 'The Approach',
    body: 'StudySync creates a more organized path from profile setup to partner matching, group formation, session scheduling, and ongoing accountability.'
  },
  {
    title: 'The Value',
    body: 'The platform brings rule-based compatibility matching, scheduling support, accountability tracking, and progress insights into one student-focused study workflow.'
  }
];

const workflowSteps = [
  'Create a profile with course, university or class, goals, availability, learning style, and study preference.',
  'Review suggested study partners or groups based on profile compatibility.',
  'Accept a match, form a study group, set goals, choose a meeting style, and schedule study sessions.',
  'Track attendance, completed sessions, group activity, participation, and study consistency.'
];

const accountabilityActions = [
  'Send reminder prompts when members become inactive',
  'Adjust the group schedule when availability changes',
  'Reduce group size when participation drops',
  'Suggest a better match when the group fit is weak'
];

const freemiumModel = [
  {
    tier: 'Free',
    description: 'Basic study matching and group features for students who want to find partners and organize sessions.'
  },
  {
    tier: 'Pro',
    description: 'Planned paid tier. Subscriptions remain unavailable until production billing and refund workflows are connected.'
  }
];

export default function ProductOverviewScreen({ onBack, onNavigateHome }: ProductOverviewScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-brand-background text-brand-on-background pb-12 w-full">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} context={<span className="hidden text-[11px] font-black tracking-[0.18em] text-brand-outline uppercase lg:inline">Product Overview</span>} />
      </header>

      <main className="max-w-[1080px] mx-auto px-5 sm:px-6 mt-8 w-full flex flex-col gap-8">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-brand-on-surface">
              Compatibility-based study group matching for more consistent student collaboration.
            </h1>
            <p className="mt-5 text-sm sm:text-base text-brand-on-surface-variant leading-relaxed max-w-2xl">
              StudySync helps students find compatible study partners, form structured study groups, schedule study sessions, and stay accountable from the beginning.
            </p>
            <p className="mt-4 text-sm sm:text-base text-brand-on-surface-variant leading-relaxed max-w-2xl">
              Instead of relying on general chat apps or random class groups, the app uses saved profile details and recorded activity signals to support a more organized study experience.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white shadow-xl min-h-[360px]">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=900"
                alt="Students collaborating on a study plan"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/35 to-transparent" />
              <div className="absolute left-5 right-5 bottom-5 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-brand-on-surface uppercase tracking-wide">Example group profile</p>
                    <p className="text-sm font-bold text-brand-primary mt-1">Calculus Midterm Sprint</p>
                  </div>
                  <span className="text-xs font-black text-[#6b38d4] bg-[#f2ebff] px-3 py-1.5 rounded-full">Compatibility Matched</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-brand-surface-low rounded-xl p-2">
                    <p className="text-[10px] font-bold text-brand-outline uppercase">Members</p>
                    <p className="text-sm font-black text-brand-on-surface mt-1">Example</p>
                  </div>
                  <div className="bg-brand-surface-low rounded-xl p-2">
                    <p className="text-[10px] font-bold text-brand-outline uppercase">Overlap</p>
                    <p className="text-sm font-black text-brand-on-surface mt-1">Compared</p>
                  </div>
                  <div className="bg-brand-surface-low rounded-xl p-2">
                    <p className="text-[10px] font-bold text-brand-outline uppercase">Goal</p>
                    <p className="text-sm font-black text-brand-on-surface mt-1">Aligned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overviewSections.map((section) => (
            <article key={section.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-extrabold text-brand-on-surface">{section.title}</h2>
              <p className="text-xs text-brand-on-surface-variant leading-relaxed mt-2">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {productHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-brand-surface-container text-brand-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-extrabold text-brand-on-surface">{item.title}</h2>
                <p className="text-xs text-brand-on-surface-variant leading-relaxed mt-2">{item.description}</p>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-extrabold text-brand-on-surface">How the StudySync flow works</h2>
            </div>
            <div className="flex flex-col gap-3">
              {workflowSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 bg-brand-surface-low rounded-xl p-3">
                  <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-brand-on-surface-variant leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-extrabold text-brand-on-surface">Accountability support</h2>
            </div>
            <p className="text-xs text-brand-on-surface-variant leading-relaxed mt-3">
              When a member becomes inactive, StudySync can flag the issue and suggest practical next steps.
            </p>
            <div className="flex flex-col gap-2.5 mt-5">
              {accountabilityActions.map((action) => (
                <div key={action} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                  <span className="text-xs font-semibold text-brand-on-surface leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f3ebff] border border-[#d0bcff]/60 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-8">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#6b38d4]" />
                <h2 className="text-lg font-extrabold text-brand-on-surface">Freemium model</h2>
              </div>
              <p className="text-xs text-brand-on-surface-variant leading-relaxed mt-3">
                StudySync supports a free entry point for basic study coordination, with Pro access for students who need deeper support.
              </p>
            </div>
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {freemiumModel.map((model) => (
                <article key={model.tier} className="bg-white/80 border border-white rounded-xl p-4">
                  <p className="text-[10px] font-black text-[#6b38d4] tracking-widest uppercase">{model.tier}</p>
                  <p className="text-xs text-brand-on-surface-variant leading-relaxed mt-2">{model.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
