import { useState, type ReactNode } from 'react';
import { Brain, Clock, Search, Target, Users } from 'lucide-react';
import type { GroupRequirements, StudentProfile } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface GroupRequirementsScreenProps {
  profile: StudentProfile;
  initialRequirements: GroupRequirements | null;
  onBack: () => void;
  onNavigateHome: () => void;
  onSubmit: (requirements: GroupRequirements) => void;
}

const choices = {
  time: ['Morning', 'Afternoon', 'Evening', 'Weekend'],
  style: ['visual', 'reading', 'discussion', 'practice', 'mixed'],
  preference: ['pair', 'group'],
  size: ['2 people', '3-4 people', '5-6 people']
};

export default function GroupRequirementsScreen({ profile, initialRequirements, onBack, onNavigateHome, onSubmit }: GroupRequirementsScreenProps) {
  const [requirements, setRequirements] = useState<GroupRequirements>(initialRequirements || {
    course: profile.major || profile.course || '',
    studyGoal: profile.studyGoal || '',
    preferredTime: profile.timeOfDay[0] || profile.preferredStudyTime || 'Evening',
    learningStyle: String(profile.learningStyles[0] || profile.learningStyle || 'mixed').toLowerCase(),
    studyPreference: profile.studyPreference === 'solo' ? 'pair' : profile.studyPreference,
    groupSize: profile.studyPreference === 'pair' ? '2 people' : '3-4 people',
    notes: ''
  });
  const valid = Boolean(requirements.course.trim() && requirements.studyGoal.trim());

  return (
    <div className="min-h-screen bg-brand-background pb-12 text-brand-on-background">
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} />
      </div>

      <main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12">
        <section className="lg:col-span-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Find a study group</span>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-on-surface">What kind of group do you need?</h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-on-surface-variant">
            Set requirements for this search. StudySync will use them to evaluate compatible people and groups.
          </p>
          <div className="mt-6 rounded-2xl border border-brand-primary/15 bg-[#e9efff] p-5">
            <Search className="h-5 w-5 text-brand-primary" />
            <p className="mt-3 text-xs font-bold text-brand-on-surface">Your profile remains unchanged</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-on-surface-variant">These requirements apply only to this group search.</p>
          </div>
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onSubmit(requirements);
          }}
          className="grid grid-cols-1 gap-5 lg:col-span-8 lg:grid-cols-2"
        >
          <FieldCard icon={Target} title="Subject and goal">
            <label htmlFor="requirements-course" className="text-xs font-bold text-brand-on-surface-variant">Course / Subject</label>
            <input id="requirements-course" value={requirements.course} onChange={(event) => setRequirements({ ...requirements, course: event.target.value })} className="mt-1 w-full rounded-xl border border-brand-outline-variant bg-brand-surface-lowest px-4 py-3 text-sm focus:border-brand-primary focus:outline-none" />
            <label htmlFor="requirements-goal" className="mt-3 text-xs font-bold text-brand-on-surface-variant">Study Goal</label>
            <textarea id="requirements-goal" rows={3} value={requirements.studyGoal} onChange={(event) => setRequirements({ ...requirements, studyGoal: event.target.value })} className="mt-1 w-full rounded-xl border border-brand-outline-variant bg-brand-surface-lowest px-4 py-3 text-sm focus:border-brand-primary focus:outline-none" />
          </FieldCard>

          <FieldCard icon={Clock} title="Preferred availability">
            <ChoiceGrid values={choices.time} selected={requirements.preferredTime} onSelect={(preferredTime) => setRequirements({ ...requirements, preferredTime })} />
          </FieldCard>

          <FieldCard icon={Brain} title="Study style">
            <ChoiceGrid values={choices.style} selected={requirements.learningStyle} onSelect={(learningStyle) => setRequirements({ ...requirements, learningStyle })} />
          </FieldCard>

          <FieldCard icon={Users} title="Group preference">
            <p className="text-xs font-bold text-brand-on-surface-variant">Collaboration type</p>
            <ChoiceGrid values={choices.preference} selected={requirements.studyPreference} onSelect={(studyPreference) => setRequirements({ ...requirements, studyPreference: studyPreference as GroupRequirements['studyPreference'] })} />
            <p className="mt-4 text-xs font-bold text-brand-on-surface-variant">Ideal group size</p>
            <ChoiceGrid values={choices.size} selected={requirements.groupSize} onSelect={(groupSize) => setRequirements({ ...requirements, groupSize })} />
          </FieldCard>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <label htmlFor="requirements-notes" className="text-xs font-bold text-brand-on-surface-variant">Additional requirements (optional)</label>
            <textarea id="requirements-notes" rows={3} placeholder="Example: Must be preparing for the same exam and willing to meet twice a week." value={requirements.notes} onChange={(event) => setRequirements({ ...requirements, notes: event.target.value })} className="mt-2 w-full rounded-xl border border-brand-outline-variant bg-brand-surface-lowest px-4 py-3 text-sm focus:border-brand-primary focus:outline-none" />
          </div>

          <button type="submit" disabled={!valid} className="rounded-xl bg-brand-primary px-6 py-4 text-sm font-bold text-white hover:bg-brand-primary-container disabled:cursor-not-allowed disabled:opacity-40 lg:col-span-2 lg:ml-auto lg:w-[320px] cursor-pointer">
            Find matching groups
          </button>
        </form>
      </main>
    </div>
  );
}

function FieldCard({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
        <Icon className="h-4 w-4 text-brand-primary" />
        <h2 className="text-sm font-extrabold text-brand-on-surface">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ChoiceGrid({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {values.map((value) => (
        <button key={value} type="button" aria-pressed={selected === value} onClick={() => onSelect(value)} className={`rounded-xl border px-3 py-2.5 text-xs font-bold capitalize transition-colors cursor-pointer ${selected === value ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-outline-variant bg-white text-brand-on-surface-variant hover:bg-brand-surface-low'}`}>
          {value}
        </button>
      ))}
    </div>
  );
}
