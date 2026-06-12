import { useEffect, useLayoutEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import { useStudySyncStore } from './store/useStudySyncStore';
import type { DiscoverableStudyGroup, MatchOption, StudyMatch } from './types';
import ProtectedRoute from './routes/ProtectedRoute';
import LandingHero from './components/LandingHero';
import SignUpform from './components/SignUpform';
import ProfileSetup from './components/ProfileSetup';
import MatchingScreen from './components/MatchingScreen';
import MatchAcceptedScreen from './components/MatchAcceptedScreen';
import GroupChatScreen from './components/GroupChatScreen';
import SmartMatchesScreen from './components/SmartMatchesScreen';
import CreateGroupScreen from './components/CreateGroupScreen';
import AvailabilityScreen from './components/AvailabilityScreen';
import SessionConfirmedScreen from './components/SessionConfirmedScreen';
import ActiveSessionScreen from './components/ActiveSessionScreen';
import ActivityDashboardScreen from './components/ActivityDashboardScreen';
import StudyProgressScreen from './components/StudyProgressScreen';
import ProgressInsightsScreen from './components/ProgressInsightsScreen';
import DecisionScreen from './components/DecisionScreen';
import ProductOverviewScreen from './components/ProductOverviewScreen';
import PricingScreen from './components/PricingScreen';
import UserDashboardScreen from './components/UserDashboardScreen';
import GroupRequirementsScreen from './components/GroupRequirementsScreen';

const toMatchOption = (match: StudyMatch): MatchOption => ({
  id: match.id,
  name: match.candidateName,
  type: 'individual',
  matchPercentage: match.matchPercentage,
  course: match.course,
  subject: match.studyGoal,
  tags: [match.availableTime, match.learningStyle, match.studyPreference],
  avatarUrl: match.avatarUrl,
  matchReason: match.matchReason
});

const toGroupOption = (group: DiscoverableStudyGroup): MatchOption => ({
  id: `discover-${group.id}`,
  groupId: group.id,
  name: group.groupName,
  type: 'group',
  matchPercentage: 0,
  course: group.course,
  subject: group.studyTarget,
  tags: [group.preferredStudyTime, group.learningStyle, `${group.memberCount} member${group.memberCount === 1 ? '' : 's'}`],
  memberCount: group.memberCount,
  matchReason: `Created by ${group.ownerName}. ${group.purpose}`
});

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const authParams = new URLSearchParams(location.search);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const store = useStudySyncStore();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    void useStudySyncStore.getState().restoreSession();
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (location.pathname === '/matches' && store.user) void store.loadMatches();
    if (location.pathname === '/group-chat' && (store.acceptedMatch || store.group?.conversationId)) void store.loadChat();
    if (location.pathname === '/schedule' && store.group) void store.generateSchedule();
    if (location.pathname === '/progress' && store.user) void store.loadProgress();
    if (location.pathname === '/guidance' && store.user) void store.loadGuidance();
  }, [location.pathname]);

  const navigateHome = () => navigate(store.user ? '/dashboard' : '/');
  const navigateBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigateHome();
  };
  const createAccount = async (data: { fullName: string; email: string; password: string }) => {
    await store.register({ name: data.fullName, email: data.email, password: data.password });
    notify(`Welcome ${data.fullName}. Your dashboard is ready.`);
    navigate('/dashboard');
  };
  const login = async (data: { email: string; password: string }) => {
    await store.login(data);
    notify('Signed in successfully.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-brand-background text-brand-on-background relative flex flex-col font-sans overflow-x-clip">
      {(toast || store.error) && (
        <div className={`fixed top-20 right-6 z-[60] max-w-sm rounded-xl border px-5 py-3 text-xs font-bold shadow-xl ${store.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-700 bg-[#111c2d] text-[#ecf1ff]'}`}>
          {store.error || toast}
        </div>
      )}

      <main className="app-viewport flex-1 w-full pb-20">
        <Routes>
          <Route path="/" element={<LandingHero onStart={() => navigate('/auth')} onLogin={() => navigate('/auth?mode=login')} onNavigateToDemo={(target) => navigate(target === 'product-overview' ? '/product-overview' : '/')} onNavigateHome={navigateHome} />} />
          <Route path="/auth" element={<><LandingHero onStart={() => undefined} onLogin={() => undefined} onNavigateToDemo={() => navigate('/product-overview')} onNavigateHome={navigateHome} /><SignUpform initialMode={authParams.get('mode') === 'reset' ? 'reset' : authParams.get('mode') === 'login' ? 'login' : 'register'} initialResetToken={authParams.get('token') || ''} onSignUpComplete={createAccount} onLoginComplete={login} onPasswordResetRequest={(email) => api.requestPasswordReset(email)} onPasswordResetConfirm={async (token, password) => { await api.confirmPasswordReset(token, password); }} onBack={navigateHome} onNavigateHome={navigateHome} /></>} />
          <Route path="/product-overview" element={<ProductOverviewScreen onBack={navigateBack} onNavigateHome={navigateHome} />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={store.user ? <UserDashboardScreen
              user={store.user}
              initialView={location.search.includes('view=joined-group') ? 'joined-group' : location.search.includes('view=settings') ? 'settings' : 'home'}
              profile={store.profile}
              group={store.group}
              session={store.session}
              sessionHistory={store.sessionHistory}
              libraryFiles={store.libraryFiles}
              onFindGroup={() => navigate(store.profile.profileCompleted ? '/group-requirements' : '/profile')}
              onBrowseMatches={() => navigate('/matches')}
              onOpenChat={() => navigate('/group-chat')}
              onOpenSchedule={() => navigate('/schedule')}
              onOpenSession={() => navigate('/session')}
              onOpenProgress={() => navigate('/progress')}
              onAddLibraryFile={store.addLibraryFile}
              onRemoveLibraryFile={store.removeLibraryFile}
              onLeaveGroup={async () => { await store.leaveGroup(); notify('You left the study group.'); navigate('/dashboard'); }}
              onLogout={async () => { await store.logout(); navigate('/'); }}
            /> : <Navigate to="/auth" replace />} />
            <Route path="/profile" element={<ProfileSetup initialProfile={store.profile} onComplete={async (profile) => { await store.saveProfile(profile); navigate('/group-requirements'); }} onBack={navigateBack} onNavigateHome={navigateHome} />} />
            <Route path="/group-requirements" element={<GroupRequirementsScreen profile={store.profile} initialRequirements={store.groupRequirements} onBack={navigateBack} onNavigateHome={navigateHome} onSubmit={(requirements) => { store.saveGroupRequirements(requirements); navigate('/matching'); }} />} />
            <Route path="/matching" element={<MatchingScreen onBack={navigateBack} onNavigateHome={navigateHome} onComplete={async () => { await store.analyze(); navigate('/matches'); }} />} />
            <Route path="/ai-analysis" element={<Navigate to="/matching" replace />} />
            <Route path="/matches" element={<SmartMatchesScreen requirements={store.groupRequirements} matchesData={[...store.discoverableGroups.map(toGroupOption), ...store.matches.map(toMatchOption)]} onEditRequirements={() => navigate('/group-requirements')} onAcceptMatch={async (match) => {
              if (match.type === 'group' && match.groupId) {
                await store.joinGroup(match.groupId);
                notify(`Joined ${match.name}.`);
                navigate('/dashboard?view=joined-group');
                return;
              }
              const joiningExistingGroup = Boolean(store.group);
              await store.acceptMatch(match.id);
              notify(joiningExistingGroup ? `${match.name} joined your study group.` : `Connected with ${match.name}.`);
              navigate(joiningExistingGroup ? '/dashboard?view=joined-group' : '/match-accepted');
            }} onRejectMatch={(id) => { if (!id.startsWith('discover-')) void store.rejectMatch(id); }} onReloadMatches={() => void store.rematch()} onNavigateToCreateGroup={() => navigate('/group-setup')} onBack={navigateBack} onNavigateHome={navigateHome} />} />
            <Route path="/match-accepted" element={<MatchAcceptedScreen currentUserName={store.user?.name || 'You'} acceptedMatch={store.acceptedMatch} onBack={navigateBack} onNavigateHome={navigateHome} onStartChat={() => navigate('/group-chat')} onConfirmGoal={async () => { await store.joinAcceptedGroup(); notify('Group terms accepted. Waiting for the first session to start.'); navigate('/session-confirmed'); }} />} />
            <Route path="/group-chat" element={<GroupChatScreen currentUser={store.user} acceptedMatch={store.acceptedMatch} group={store.group} messages={store.chatMessages} onBack={navigateBack} onNavigateHome={navigateHome} onConfirmGroup={async () => { await store.joinAcceptedGroup(); notify('Group terms accepted. Waiting for the first session to start.'); navigate('/session-confirmed'); }} onSendMessage={store.sendChatMessage} />} />
            <Route path="/group-setup" element={<CreateGroupScreen onBack={navigateBack} onGroupSetupDone={async (group) => { await store.createGroup({ groupName: group.name, purpose: group.purpose, meetingStyle: group.meetingStyle, studyTarget: group.targetGoal, rules: group.rules }); notify(`Study group "${group.name}" created. Waiting for members to join.`); navigate('/dashboard?view=joined-group'); }} onNavigateHome={navigateHome} />} />
            <Route path="/schedule" element={<AvailabilityScreen groupName={store.group?.groupName || 'Study Group'} groupMembers={store.group?.members || []} suggestions={store.scheduleSuggestions} onBack={navigateBack} onScheduleConfirmed={async (slot) => { await store.confirmSession(slot); notify('Study session confirmed.'); navigate('/session-confirmed'); }} onNavigateHome={navigateHome} />} />
            <Route path="/session-confirmed" element={<SessionConfirmedScreen session={store.session} onBack={navigateBack} onNavigateHome={navigateHome} onReminder={() => { if (store.session) void api.setReminder(store.session.id); notify('Session reminder activated.'); }} onViewSession={() => navigate('/session')} />} />
            <Route path="/session" element={<ActiveSessionScreen session={store.session} currentUser={store.user} onBack={navigateBack} onNavigateHome={navigateHome} onMarkAttendance={async () => { await store.markAttendance(); notify('Attendance recorded.'); }} onSessionComplete={async () => { await store.trackAccountability(); navigate('/accountability'); }} />} />
            <Route path="/accountability" element={<ActivityDashboardScreen accountability={store.accountability} groupMembers={store.group?.members || []} currentUserName={store.user?.name || 'You'} onBack={navigateBack} onNavigateHome={navigateHome} onNavigateToProgress={() => navigate('/progress')} />} />
            <Route path="/progress" element={<StudyProgressScreen analytics={store.progress} onBack={navigateBack} onNavigateToInsights={() => navigate('/guidance')} onNavigateHome={navigateHome} />} />
            <Route path="/guidance" element={<ProgressInsightsScreen guidanceData={store.guidance} onBack={navigateBack} onNavigateHome={navigateHome} onRematch={async () => { await store.rematch(); navigate('/matches'); }} onAdjustSchedule={() => navigate('/schedule')} onContinue={() => navigate('/decision')} />} />
            <Route path="/ai-feedback" element={<Navigate to="/guidance" replace />} />
            <Route path="/decision" element={<DecisionScreen paused={paused} onBack={navigateBack} onNavigateHome={navigateHome} onContinue={() => navigate('/pro')} onRematch={async () => { await store.rematch(); navigate('/matches'); }} onPause={async () => { await store.pauseActivity(); setPaused(true); notify('Study activity paused.'); }} />} />
            <Route path="/pro" element={<PricingScreen onBack={navigateBack} onContinueFree={() => navigate('/decision')} onNavigateHome={navigateHome} />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center border-t border-gray-100 bg-white px-6 py-4 text-xs text-brand-on-surface-variant shadow-[0_-8px_24px_rgba(17,28,45,0.06)]">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-outline">© 2026 StudySync Corp.</span>
      </footer>
    </div>
  );
}
