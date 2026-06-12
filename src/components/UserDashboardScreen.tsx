import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  FolderOpen,
  History,
  LogOut,
  MessageSquare,
  Crown,
  Check,
  Search,
  Sparkles,
  Settings,
  Trash2,
  Upload,
  UserRound,
  Users,
  X
} from 'lucide-react';
import type { LibraryFile, StudyGroup, StudySession, StudentProfile, User } from '../types';

type DashboardView = 'home' | 'joined-group' | 'library' | 'history' | 'friends' | 'settings';

interface UserDashboardScreenProps {
  user: User;
  initialView?: DashboardView;
  profile: StudentProfile;
  group: StudyGroup | null;
  session: StudySession | null;
  sessionHistory: StudySession[];
  libraryFiles: LibraryFile[];
  onFindGroup: () => void;
  onBrowseMatches: () => void;
  onOpenChat: () => void;
  onOpenSchedule: () => void;
  onOpenSession: () => void;
  onOpenProgress: () => void;
  onAddLibraryFile: (file: LibraryFile) => void;
  onRemoveLibraryFile: (id: string) => void;
  onLeaveGroup: () => Promise<void>;
  onLogout: () => Promise<void>;
}

const tabs: Array<{ id: DashboardView; label: string; icon: typeof Search }> = [
  { id: 'home', label: 'Home', icon: Search },
  { id: 'joined-group', label: 'Joined Group', icon: Users },
  { id: 'library', label: 'Library', icon: FolderOpen },
  { id: 'history', label: 'History', icon: History }
];

const formatBytes = (size: number) => size < 1024 * 1024
  ? `${Math.max(1, Math.round(size / 1024))} KB`
  : `${(size / (1024 * 1024)).toFixed(1)} MB`;

const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Core study coordination',
    benefits: ['Create or join one study group', 'Basic matching and group chat', 'Session scheduling']
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$3.45',
    description: 'Better tools for regular study',
    benefits: ['Everything in Free', 'Unlimited group matching', 'Expanded progress tracking', 'Additional coordination tools']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$5',
    description: 'Full StudySync experience',
    benefits: ['Everything in Standard', 'Course mastery analytics', 'Priority scheduling tools', 'Additional progress reports']
  }
] as const;

export default function UserDashboardScreen({
  user,
  initialView = 'home',
  profile,
  group,
  session,
  sessionHistory,
  libraryFiles,
  onFindGroup,
  onBrowseMatches,
  onOpenChat,
  onOpenSchedule,
  onOpenSession,
  onOpenProgress,
  onAddLibraryFile,
  onRemoveLibraryFile,
  onLeaveGroup,
  onLogout
}: UserDashboardScreenProps) {
  const [view, setView] = useState<DashboardView>(initialView);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [studyRemindersEnabled, setStudyRemindersEnabled] = useState(true);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<(typeof subscriptionPlans)[number]['id']>(user.isPro ? 'pro' : 'free');
  const currentSubscription: (typeof subscriptionPlans)[number]['id'] = user.isPro ? 'pro' : 'free';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const profileComplete = Boolean(profile.profileCompleted);
  const groupIsRecruiting = Boolean(group && group.members.length <= 1);
  const groupReady = Boolean(group && group.members.length > 1);
  const displayedPlan = subscriptionPlans.find((plan) => plan.id === activePlan) || subscriptionPlans[0];

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Files must be 2 MB or smaller for browser storage.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onAddLibraryFile({
        id: `library-${crypto.randomUUID()}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl: String(reader.result)
      });
      setUploadError('');
    };
    reader.onerror = () => setUploadError('The selected file could not be read.');
    reader.readAsDataURL(file);
  };

  const selectView = (nextView: DashboardView) => {
    setView(nextView);
    setProfileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-brand-background text-brand-on-background">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-6">
          <button type="button" onClick={() => selectView('home')} className="flex shrink-0 items-center gap-2 text-brand-primary cursor-pointer">
            <BookOpen className="h-5 w-5" fill="currentColor" />
            <span className="hidden text-lg font-extrabold sm:inline">StudySync</span>
          </button>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Dashboard navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectView(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-5 text-xs font-bold transition-colors cursor-pointer ${
                    active ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-on-surface-variant hover:text-brand-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setSubscriptionOpen(true)}
            className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-[#f3ebff] px-3 py-2 text-xs font-extrabold text-brand-secondary transition-colors hover:bg-[#e9ddff] sm:flex cursor-pointer"
          >
            <Crown className="h-4 w-4" />
            {currentSubscription === 'free' ? 'Premium' : subscriptionPlans.find((plan) => plan.id === currentSubscription)?.name}
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-brand-surface-low cursor-pointer"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-xs font-black text-white">{initials}</span>
              <ChevronDown className="hidden h-4 w-4 text-brand-outline sm:block" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-extrabold text-brand-on-surface">{user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-brand-on-surface-variant">{user.email}</p>
                  {user.isPro && <span className="mt-2 inline-flex rounded bg-[#f2ebff] px-2 py-1 text-[9px] font-black uppercase text-brand-secondary">Pro account</span>}
                </div>
                <div className="p-1.5">
                  <button type="button" onClick={() => selectView('friends')} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-bold text-brand-on-surface-variant hover:bg-brand-surface-low cursor-pointer">
                    <Users className="h-4 w-4" />Friends
                  </button>
                  <button type="button" onClick={() => selectView('settings')} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-bold text-brand-on-surface-variant hover:bg-brand-surface-low cursor-pointer">
                    <Settings className="h-4 w-4" />Settings
                  </button>
                  <button type="button" onClick={() => void onLogout()} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-bold text-brand-error hover:bg-red-50 cursor-pointer">
                    <LogOut className="h-4 w-4" />Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-4 pb-24 pt-24 sm:px-6">
        {view === 'home' && (
          <div className="flex flex-col gap-7">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-primary">Dashboard</p>
              <h1 className="mt-2 text-3xl font-extrabold text-brand-on-surface">Welcome back, {user.name.split(' ')[0]}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-on-surface-variant">
                Find a compatible study group, continue an active session, or review your learning progress.
              </p>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-outline">Profile</p>
                <p className="mt-2 text-xl font-extrabold text-brand-on-surface">{profileComplete ? 'Complete' : 'Needs setup'}</p>
                <p className="mt-1 text-xs text-brand-on-surface-variant">{profileComplete ? profile.major : 'Complete your profile before matching.'}</p>
              </article>
              <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-outline">Current group</p>
                <p className="mt-2 truncate text-xl font-extrabold text-brand-on-surface">{group?.groupName || 'None yet'}</p>
                <p className="mt-1 text-xs text-brand-on-surface-variant">{group ? `${group.members.length} member${group.members.length === 1 ? '' : 's'}, ${groupIsRecruiting ? 'recruiting' : group.meetingStyle}` : 'Accept a match to start a group.'}</p>
                {group && (
                  <button type="button" onClick={() => setLeaveConfirmationOpen(true)} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-brand-error hover:underline cursor-pointer">
                    <LogOut className="h-3.5 w-3.5" />Leave current group
                  </button>
                )}
              </article>
              <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-outline">Library</p>
                <p className="mt-2 text-xl font-extrabold text-brand-on-surface">{libraryFiles.length} files</p>
                <p className="mt-1 text-xs text-brand-on-surface-variant">Private to this account on this browser.</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <Search className="h-6 w-6 text-brand-primary" />
                <h2 className="mt-4 text-lg font-extrabold text-brand-on-surface">{profileComplete ? 'Find your next study group' : 'Complete your study profile'}</h2>
                <p className="mt-2 text-xs leading-relaxed text-brand-on-surface-variant">
                  {profileComplete ? 'Generate compatible study partners using your course, goals, schedule, and learning preferences.' : 'StudySync needs your course, goals, learning style, and availability before generating matches.'}
                </p>
                <button type="button" onClick={onFindGroup} className="mt-5 rounded-lg bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-container cursor-pointer">
                  {profileComplete ? 'Find Group' : 'Complete Profile'}
                </button>
                {profileComplete && (
                  <button type="button" onClick={onBrowseMatches} className="ml-2 mt-5 rounded-lg border border-brand-outline-variant px-4 py-3 text-xs font-bold text-brand-primary hover:bg-brand-surface-low cursor-pointer">
                    Browse Matches
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <CalendarCheck className="h-6 w-6 text-brand-secondary" />
                <h2 className="mt-4 text-lg font-extrabold text-brand-on-surface">Continue studying</h2>
                <p className="mt-2 text-xs leading-relaxed text-brand-on-surface-variant">
                  {session ? `${session.topic} is ${session.status}.` : 'No confirmed study session yet.'}
                </p>
                <button type="button" onClick={session ? onOpenSession : onOpenSchedule} disabled={!group} className="mt-5 rounded-lg bg-brand-secondary px-4 py-3 text-xs font-bold text-white hover:bg-[#8455ef] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer">
                  {session ? 'Open Session' : 'Schedule Session'}
                </button>
              </div>
            </section>
          </div>
        )}

        {view === 'joined-group' && (
          <div>
            <div>
              <h1 className="text-2xl font-extrabold text-brand-on-surface">Joined Group</h1>
              <p className="mt-2 text-sm text-brand-on-surface-variant">Manage your current study group and next actions.</p>
            </div>
            {group ? (
              <section className="mt-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{group.purpose}</p>
                    <h2 className="mt-1 text-xl font-extrabold text-brand-on-surface">{group.groupName}</h2>
                    <p className="mt-2 text-xs text-brand-on-surface-variant">{group.studyTarget}</p>
                  </div>
                  <span className={`self-start rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${groupIsRecruiting ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                    {groupIsRecruiting ? 'Recruiting' : 'Active'}
                  </span>
                </div>
                {groupIsRecruiting && (
                  <div className="mt-6 rounded-xl border border-dashed border-brand-outline-variant bg-brand-surface-low p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-extrabold text-brand-on-surface">Waiting for members to join</p>
                        <p className="mt-1 text-xs leading-relaxed text-brand-on-surface-variant">
                          Your group plan is published. Browse compatible matches and invite members before scheduling the first session.
                        </p>
                      </div>
                      <button type="button" onClick={onFindGroup} className="shrink-0 rounded-lg bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-container cursor-pointer">
                        Find Members
                      </button>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-gray-100 bg-white p-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-brand-outline">Creator</p>
                        <p className="mt-1 truncate text-xs font-bold text-brand-on-surface">{group.members[0] || user.name}</p>
                      </div>
                      {[1, 2, 3].map((slot) => (
                        <div key={slot} className="flex min-h-14 items-center justify-center rounded-lg border border-dashed border-brand-outline-variant bg-white text-[10px] font-bold text-brand-outline">
                          Waiting for member
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button type="button" onClick={onOpenChat} disabled={!groupReady || !group.conversationId} className="flex items-center justify-center gap-2 rounded-lg border border-brand-outline-variant px-3 py-3 text-xs font-bold text-brand-primary hover:bg-brand-surface-low disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"><MessageSquare className="h-4 w-4" />Chat</button>
                  <button type="button" onClick={onOpenSchedule} disabled={!groupReady} className="flex items-center justify-center gap-2 rounded-lg border border-brand-outline-variant px-3 py-3 text-xs font-bold text-brand-primary hover:bg-brand-surface-low disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"><CalendarCheck className="h-4 w-4" />Schedule</button>
                  <button type="button" onClick={onOpenSession} disabled={!session} className="flex items-center justify-center gap-2 rounded-lg border border-brand-outline-variant px-3 py-3 text-xs font-bold text-brand-primary hover:bg-brand-surface-low disabled:opacity-40 cursor-pointer"><Clock className="h-4 w-4" />Session</button>
                  <button type="button" onClick={onOpenProgress} disabled={!groupReady} className="flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-3 text-xs font-bold text-white hover:bg-brand-primary-container disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"><CheckCircle2 className="h-4 w-4" />Progress</button>
                </div>
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <button type="button" onClick={() => setLeaveConfirmationOpen(true)} className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-xs font-bold text-brand-error hover:bg-red-50 cursor-pointer">
                    <LogOut className="h-4 w-4" />Leave Group
                  </button>
                </div>
              </section>
            ) : (
              <EmptyState icon={Users} title="No joined group" description="Find and accept a compatible match to form your first study group." action="Find Group" onAction={onFindGroup} />
            )}
          </div>
        )}

        {view === 'library' && (
          <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-on-surface">Library</h1>
                <p className="mt-2 text-sm text-brand-on-surface-variant">Store study files privately for this signed-in account on this browser.</p>
              </div>
              <div>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.md" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-container cursor-pointer">
                  <Upload className="h-4 w-4" />Upload File
                </button>
              </div>
            </div>
            {uploadError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{uploadError}</p>}
            {libraryFiles.length ? (
              <div className="mt-6 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                {libraryFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 border-b border-gray-100 px-4 py-4 last:border-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-surface-container text-brand-primary"><FileText className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-on-surface">{file.name}</p>
                      <p className="mt-0.5 text-[10px] text-brand-outline">{formatBytes(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <a href={file.dataUrl} download={file.name} aria-label={`Download ${file.name}`} title="Download file" className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary hover:bg-brand-surface-low"><Download className="h-4 w-4" /></a>
                    <button type="button" onClick={() => onRemoveLibraryFile(file.id)} aria-label={`Remove ${file.name}`} title="Remove file" className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-error hover:bg-red-50 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FolderOpen} title="Library is empty" description="Upload notes, slides, documents, or reading material to keep them available during study sessions." action="Upload File" onAction={() => fileInputRef.current?.click()} />
            )}
          </div>
        )}

        {view === 'history' && (
          <div>
            <h1 className="text-2xl font-extrabold text-brand-on-surface">Session History</h1>
            <p className="mt-2 text-sm text-brand-on-surface-variant">Review summaries from finished group sessions.</p>
            {sessionHistory.length ? (
              <div className="mt-6 flex flex-col gap-3">
                {sessionHistory.map((item) => (
                  <article key={item.id} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Completed</p>
                        <h2 className="mt-1 text-base font-extrabold text-brand-on-surface">{item.topic}</h2>
                        <p className="mt-1 text-xs text-brand-on-surface-variant">{item.date} · {item.time}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="mt-4 border-t border-gray-100 pt-4 text-xs leading-relaxed text-brand-on-surface-variant">
                      The group completed the planned session for “{item.studyGoal || 'the current study target'}”. Attendance was recorded and progress analytics were updated.
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={History} title="No completed sessions" description="Finished study session summaries will appear here after attendance is recorded." />
            )}
          </div>
        )}

        {view === 'friends' && (
          <div>
            <h1 className="text-2xl font-extrabold text-brand-on-surface">Friends</h1>
            <p className="mt-2 text-sm text-brand-on-surface-variant">People connected through your study activity.</p>
            <div className="mt-6 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
              {(group?.members || []).filter((member) => member !== user.name).map((member) => (
                <div key={member} className="flex items-center gap-3 border-b border-gray-100 px-4 py-4 last:border-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-surface-container text-xs font-black text-brand-primary">
                    {member.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-on-surface">{member}</p>
                    <p className="text-xs text-brand-on-surface-variant">Study group member</p>
                  </div>
                  <button type="button" onClick={onOpenChat} disabled={!group?.conversationId} className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary hover:bg-brand-surface-low disabled:opacity-40 cursor-pointer" title="Open group chat"><MessageSquare className="h-4 w-4" /></button>
                </div>
              ))}
              {(!group || group.members.filter((member) => member !== user.name).length === 0) && (
                <p className="px-4 py-8 text-center text-xs font-semibold text-brand-on-surface-variant">No connected group members yet.</p>
              )}
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div>
            <h1 className="text-2xl font-extrabold text-brand-on-surface">Settings</h1>
            <p className="mt-2 text-sm text-brand-on-surface-variant">Manage dashboard preferences for this browser.</p>
            <section className="mt-6 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
              <SettingRow icon={Bell} title="Notifications" description="Show updates for group activity and messages." enabled={notificationsEnabled} onToggle={() => setNotificationsEnabled((enabled) => !enabled)} />
              <SettingRow icon={Clock} title="Study reminders" description="Receive reminders before confirmed sessions." enabled={studyRemindersEnabled} onToggle={() => setStudyRemindersEnabled((enabled) => !enabled)} />
              <div className="flex items-center gap-3 px-5 py-4">
                <UserRound className="h-5 w-5 text-brand-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brand-on-surface">{user.name}</p>
                  <p className="truncate text-xs text-brand-on-surface-variant">{user.email}</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {leaveConfirmationOpen && group && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111c2d]/55 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setLeaveConfirmationOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="leave-group-title" className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-2xl">
            <h2 id="leave-group-title" className="text-xl font-extrabold text-brand-on-surface">Leave {group.groupName}?</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-on-surface-variant">
              You will lose access to this group’s chat, schedule, and future sessions. If you own the group, ownership transfers to the longest-standing remaining member.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setLeaveConfirmationOpen(false)} className="rounded-xl border border-brand-outline-variant px-5 py-3 text-xs font-bold text-brand-on-surface-variant hover:bg-brand-surface-low cursor-pointer">
                Keep Group
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onLeaveGroup();
                  setLeaveConfirmationOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-error px-5 py-3 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {subscriptionOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111c2d]/55 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSubscriptionOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="subscription-title" className="max-h-[calc(100vh-4rem)] w-full max-w-[920px] overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">StudySync subscriptions</span>
                <h2 id="subscription-title" className="mt-1 text-2xl font-extrabold text-brand-on-surface">Choose your study plan</h2>
                <p className="mt-1 text-xs text-brand-on-surface-variant">Hover or focus a plan to review its benefits.</p>
              </div>
              <button type="button" onClick={() => setSubscriptionOpen(false)} aria-label="Close subscriptions" className="flex h-9 w-9 items-center justify-center rounded-full text-brand-outline hover:bg-brand-surface-low cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-8">
                {subscriptionPlans.map((plan) => {
                  const active = activePlan === plan.id;
                  const current = plan.id === currentSubscription;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onMouseEnter={() => setActivePlan(plan.id)}
                      onFocus={() => setActivePlan(plan.id)}
                      onClick={() => setActivePlan(plan.id)}
                      className={`relative min-h-44 rounded-2xl border-2 p-5 text-left transition-all cursor-pointer ${active ? 'border-brand-primary bg-[#e9efff] shadow-md' : 'border-gray-100 bg-white hover:-translate-y-1 hover:border-brand-outline-variant hover:shadow-md'}`}
                    >
                      {plan.id === 'pro' && <Sparkles className="absolute right-4 top-4 h-4 w-4 text-brand-secondary" />}
                      <p className="text-sm font-extrabold text-brand-on-surface">{plan.name}</p>
                      <p className="mt-3 text-3xl font-black text-brand-primary">{plan.price}<span className="text-xs font-bold text-brand-outline"> / month</span></p>
                      <p className="mt-3 text-xs leading-relaxed text-brand-on-surface-variant">{plan.description}</p>
                      {current && <span className="mt-4 inline-flex rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase text-brand-primary">Current plan</span>}
                    </button>
                  );
                })}
              </div>

              <aside className="rounded-2xl border border-gray-100 bg-brand-surface-low p-5 lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{displayedPlan.name} benefits</p>
                <p className="mt-2 text-xl font-extrabold text-brand-on-surface">{displayedPlan.price}<span className="text-xs text-brand-outline"> / month</span></p>
                <div className="mt-5 flex flex-col gap-3">
                  {displayedPlan.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2 text-xs font-semibold text-brand-on-surface-variant">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-6 w-full rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-container disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                >
                  {activePlan === currentSubscription ? 'Current plan' : 'Subscriptions unavailable'}
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }: { icon: typeof Users; title: string; description: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-brand-outline-variant bg-white px-6 text-center">
      <Icon className="h-8 w-8 text-brand-outline" />
      <h2 className="mt-4 text-base font-extrabold text-brand-on-surface">{title}</h2>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-brand-on-surface-variant">{description}</p>
      {action && <button type="button" onClick={onAction} className="mt-5 rounded-lg bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-container cursor-pointer">{action}</button>}
    </div>
  );
}

function SettingRow({ icon: Icon, title, description, enabled, onToggle }: { icon: typeof Bell; title: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      <Icon className="h-5 w-5 text-brand-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-brand-on-surface">{title}</p>
        <p className="text-xs text-brand-on-surface-variant">{description}</p>
      </div>
      <button type="button" onClick={onToggle} aria-label={`Toggle ${title}`} className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-brand-primary' : 'bg-gray-300'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
