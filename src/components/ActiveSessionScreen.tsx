import { useState } from 'react';
import { ArrowLeft, BarChart3, Check, Clock, ClipboardCheck, Users, X } from 'lucide-react';
import type { StudySession, User } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface ActiveSessionScreenProps {
  onBack: () => void;
  onNavigateHome: () => void;
  onSessionComplete: () => void;
  onMarkAttendance?: () => Promise<void> | void;
  session: StudySession | null;
  currentUser: User | null;
}

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function ActiveSessionScreen({
  onBack,
  onNavigateHome,
  onSessionComplete,
  onMarkAttendance,
  session,
  currentUser
}: ActiveSessionScreenProps) {
  const [activeTab, setActiveTab] = useState<'joined' | 'late' | 'missed'>('joined');
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const memberNames = session?.members.length ? session.members : [currentUser?.name || 'You'];
  const attendanceRecords = [{
    id: `${session?.id || 'session'}-${currentUser?.id || 'current-user'}`,
    name: currentUser?.name || 'You',
    status: attendanceMarked ? 'joined' as const : 'missed' as const,
    time: attendanceMarked ? 'Marked just now' : 'Awaiting check-in'
  }];
  const attendanceCounts = {
    joined: attendanceRecords.filter((item) => item.status === 'joined').length,
    late: 0,
    missed: attendanceRecords.filter((item) => item.status === 'missed').length
  };
  const presentCount = attendanceCounts.joined + attendanceCounts.late;
  const attendanceRate = Math.round((presentCount / Math.max(attendanceRecords.length, 1)) * 100);

  const handleMarkAttendance = async () => {
    await onMarkAttendance?.();
    setAttendanceMarked(true);
    setActiveTab('joined');
  };

  const filteredAttendance = attendanceRecords.filter((item) => {
    if (activeTab === 'joined') return item.status === 'joined';
    if (activeTab === 'late') return false;
    return item.status === 'missed';
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-brand-background pb-12 text-brand-on-background">
      <header className="flex flex-col gap-4 border-b border-gray-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} context={<span className="hidden items-center gap-1.5 rounded-full bg-brand-surface-container px-3 py-1 text-xs font-bold text-brand-primary lg:inline-flex">
          <span className="h-2 w-2 rounded-full bg-brand-primary" />
          Session coordination
        </span>} />
      </header>

      <main className="mx-auto mt-6 grid w-full max-w-[1180px] grid-cols-1 gap-5 px-4 sm:px-6 lg:grid-cols-12">
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-brand-outline lg:col-span-12">
          <span>Groups</span>
          <span className="text-gray-300">&gt;</span>
          <span className="text-brand-on-surface">{session?.studyGoal || 'Study Group'}</span>
          <span className="text-gray-300">&gt;</span>
          <span className="font-extrabold text-brand-primary">{session?.topic || 'Study Session'}</span>
        </div>

        <section className="mt-1 flex flex-col items-start px-1 lg:col-span-12">
          <div className="flex w-full items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold leading-tight text-brand-on-surface">{session?.topic || 'Study Session'}</h1>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-outline-variant bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
              Attendance and planning
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-brand-on-surface-variant">
            <Clock className="h-4 w-4 shrink-0 text-brand-primary" />
            <span>{session?.date || 'Scheduled date'} · {session?.time || 'Scheduled time'}</span>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-4">
          <button
            type="button"
            onClick={handleMarkAttendance}
            disabled={attendanceMarked}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-bold transition-colors ${
              attendanceMarked
                ? 'cursor-default border-green-200 bg-green-50 text-green-700'
                : 'cursor-pointer border-[#004ac6] bg-white text-[#004ac6] hover:bg-brand-surface-low'
            }`}
          >
            <Check className="h-4 w-4" />
            {attendanceMarked ? 'Attendance Marked' : 'Mark Attendance'}
          </button>
        </section>

        <section className="flex min-h-[360px] w-full flex-col rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:col-span-8 lg:row-span-2">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface-container text-brand-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-brand-on-surface">Session members</h3>
              <p className="mt-1 text-xs text-brand-on-surface-variant">Use group chat for coordination. Live audio and video are not offered.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {memberNames.map((member) => (
              <div key={member} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand-surface-low p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface-container text-[10px] font-black text-brand-primary">
                  {initials(member)}
                </span>
                <span className="text-xs font-bold text-brand-on-surface">{member === currentUser?.name ? `${member} (you)` : member}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex gap-4 rounded-3xl border border-brand-secondary/20 bg-[#f2ebff] p-6 lg:col-span-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-secondary/15 bg-white shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-brand-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-[#6b38d4]">Session checklist</h4>
            <p className="mt-2.5 text-xs font-medium leading-relaxed text-brand-on-surface-variant">
              Mark attendance when you arrive, use group chat to coordinate, and review accountability after the session.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
            <BarChart3 className="h-4 w-4 text-brand-primary" />
            <h3 className="text-sm font-bold text-brand-on-surface">Session Analytics</h3>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#434655]">
              <span className="font-semibold">Attendance Rate</span>
              <span className="font-mono font-bold">{attendanceRate}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand-primary" style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#434655]">
              <span className="font-semibold">Members Present</span>
              <span className="font-mono font-bold text-brand-secondary">{presentCount}/{attendanceRecords.length}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand-secondary" style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <span className="text-xs font-extrabold text-brand-on-surface">Attendance</span>
            <span className="rounded-md border border-brand-outline-variant/35 bg-[#e9efff] px-2.5 py-1 font-mono text-[10px] font-bold text-brand-primary">
              {presentCount}/{attendanceRecords.length}
            </span>
          </div>
          <div className="my-4 grid grid-cols-3 gap-2 border-b border-gray-100">
            {(['joined', 'late', 'missed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 pb-2.5 text-center text-xs font-bold capitalize transition-colors cursor-pointer ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-outline hover:text-brand-on-surface'}`}
              >
                {tab} ({attendanceCounts[tab]})
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {filteredAttendance.map((person) => (
              <div key={person.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-brand-surface-container text-[10px] font-black text-brand-primary">
                    {initials(person.name)}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-brand-on-surface">{person.name}</h4>
                    <p className="mt-0.5 text-[10px] font-medium text-brand-outline">{person.time}</p>
                  </div>
                </div>
                {person.status === 'joined' && <Check className="h-4 w-4 text-brand-primary" />}
                {person.status === 'missed' && <X className="h-4 w-4 text-red-500" />}
              </div>
            ))}
            {!filteredAttendance.length && (
              <p className="py-6 text-center text-xs font-semibold text-brand-on-surface-variant">No members in this category.</p>
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={onSessionComplete}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-outline-variant bg-white py-4 text-sm font-bold text-brand-primary shadow-3xs transition-colors hover:border-brand-primary hover:bg-brand-surface-low cursor-pointer lg:col-span-12 lg:mx-auto lg:max-w-[440px]"
        >
          View Post-Session Accountability
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </button>
      </main>
    </div>
  );
}
