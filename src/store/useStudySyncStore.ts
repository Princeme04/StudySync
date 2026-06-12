import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialProfile } from '../data';
import { api } from '../services/api';
import type { GuidanceItem, AccountabilityRecord, ChatMessage, CreateStudyGroupInput, DiscoverableStudyGroup, GroupRequirements, LibraryFile, ProgressAnalytics, ScheduleSuggestion, StudyGroup, StudyMatch, StudySession, StudentProfile, User } from '../types';

interface StudySyncState {
  user: User | null;
  profile: StudentProfile;
  groupRequirements: GroupRequirements | null;
  matches: StudyMatch[];
  discoverableGroups: DiscoverableStudyGroup[];
  acceptedMatch: StudyMatch | null;
  groups: StudyGroup[];
  group: StudyGroup | null;
  scheduleSuggestions: ScheduleSuggestion[];
  session: StudySession | null;
  accountability: AccountabilityRecord | null;
  progress: ProgressAnalytics | null;
  guidance: GuidanceItem[];
  chatMessages: ChatMessage[];
  libraryFiles: LibraryFile[];
  libraryFilesByUser: Record<string, LibraryFile[]>;
  sessionHistory: StudySession[];
  loading: boolean;
  error: string | null;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  restoreSession: () => Promise<void>;
  loadWorkflow: () => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (profile: StudentProfile) => Promise<void>;
  saveGroupRequirements: (requirements: GroupRequirements) => void;
  analyze: () => Promise<void>;
  loadMatches: () => Promise<void>;
  acceptMatch: (id: string) => Promise<void>;
  rejectMatch: (id: string) => Promise<void>;
  rematch: () => Promise<void>;
  loadChat: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  createGroup: (group: CreateStudyGroupInput) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  joinAcceptedGroup: () => Promise<void>;
  generateSchedule: () => Promise<void>;
  confirmSession: (slot?: { date?: string; time?: string }) => Promise<void>;
  markAttendance: () => Promise<void>;
  trackAccountability: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadGuidance: () => Promise<void>;
  pauseActivity: () => Promise<void>;
  addLibraryFile: (file: LibraryFile) => void;
  removeLibraryFile: (id: string) => void;
  clearError: () => void;
}

const task = async (set: (value: Partial<StudySyncState>) => void, fn: () => Promise<void>) => {
  set({ loading: true, error: null });
  try { await fn(); } catch (error) { set({ error: error instanceof Error ? error.message : 'Something went wrong.' }); throw error; }
  finally { set({ loading: false }); }
};

const workflowState = (user: User, workflow: Awaited<ReturnType<typeof api.loadWorkflow>>) => ({
  profile: workflow.profile
    ? { ...workflow.profile, fullName: user.name, email: user.email }
    : { ...initialProfile, fullName: user.name, email: user.email, profileCompleted: false },
  matches: workflow.matches,
  acceptedMatch: workflow.acceptedMatch,
  groups: workflow.groups,
  group: workflow.group,
  session: workflow.session,
  sessionHistory: workflow.sessionHistory,
  accountability: workflow.accountability
});

const libraryForUser = (filesByUser: Record<string, LibraryFile[]>, userId: string) => filesByUser[userId] || [];

export const useStudySyncStore = create<StudySyncState>()(persist((set, get) => ({
  user: null, profile: initialProfile, groupRequirements: null, matches: [], discoverableGroups: [], acceptedMatch: null, groups: [], group: null,
  scheduleSuggestions: [], session: null, accountability: null, progress: null, guidance: [], chatMessages: [],
  libraryFiles: [], libraryFilesByUser: {}, sessionHistory: [],
  loading: false, error: null,
  register: (data) => task(set, async () => {
    const result = await api.register(data);
    set({ user: result.user, profile: { ...get().profile, fullName: result.user.name, email: result.user.email, profileCompleted: false }, libraryFiles: libraryForUser(get().libraryFilesByUser, result.user.id) });
  }),
  login: (data) => task(set, async () => {
    const result = await api.login(data);
    const workflow = await api.loadWorkflow();
    set({ user: result.user, ...workflowState(result.user, workflow), libraryFiles: libraryForUser(get().libraryFilesByUser, result.user.id) });
  }),
  restoreSession: () => task(set, async () => {
    try {
      const result = await api.me();
      const workflow = await api.loadWorkflow();
      set({ user: result.user, ...workflowState(result.user, workflow), libraryFiles: libraryForUser(get().libraryFilesByUser, result.user.id) });
    } catch {
      set({ user: null });
    }
  }),
  loadWorkflow: () => task(set, async () => {
    const user = get().user;
    if (!user) return;
    const workflow = await api.loadWorkflow();
    set(workflowState(user, workflow));
  }),
  logout: () => task(set, async () => {
    await api.logout().catch(() => undefined);
    set({
      user: null,
      profile: initialProfile,
      groupRequirements: null,
      matches: [],
      discoverableGroups: [],
      acceptedMatch: null,
      groups: [],
      group: null,
      scheduleSuggestions: [],
      session: null,
      accountability: null,
      progress: null,
      guidance: [],
      chatMessages: [],
      libraryFiles: []
    });
  }),
  saveProfile: (profile) => task(set, async () => { const result = await api.saveProfile(profile); set({ profile: { ...profile, ...result.profile, fullName: profile.fullName, email: profile.email } }); }),
  saveGroupRequirements: (requirements) => set({ groupRequirements: requirements }),
  analyze: () => task(set, async () => {
    const [matches, groups] = await Promise.all([api.analyze(get().groupRequirements), api.discoverGroups()]);
    set({ matches: matches.matches, discoverableGroups: groups.groups });
  }),
  loadMatches: () => task(set, async () => {
    if (!get().user) return;
    const [matches, groups] = await Promise.all([api.loadMatches(), api.discoverGroups()]);
    set({ matches: matches.matches, discoverableGroups: groups.groups });
  }),
  acceptMatch: (matchId) => task(set, async () => {
    const result = await api.acceptMatch(matchId);
    set({ acceptedMatch: result.match, group: result.group || get().group, matches: get().matches.filter((m) => m.id !== matchId) });
  }),
  rejectMatch: (matchId) => task(set, async () => { await api.rejectMatch(matchId); set({ matches: get().matches.filter((m) => m.id !== matchId) }); }),
  rematch: () => task(set, async () => {
    const [matches, groups] = await Promise.all([api.rematch(get().groupRequirements), api.discoverGroups()]);
    set({ matches: matches.matches, discoverableGroups: groups.groups, acceptedMatch: null });
  }),
  loadChat: () => task(set, async () => {
    const conversationId = get().acceptedMatch?.conversationId || get().group?.conversationId; if (!conversationId) return;
    const result = await api.loadChat(conversationId); set({ chatMessages: result.messages });
  }),
  sendChatMessage: (message) => task(set, async () => {
    const conversationId = get().acceptedMatch?.conversationId || get().group?.conversationId; if (!conversationId) return;
    const result = await api.sendChatMessage(conversationId, message);
    set({ chatMessages: [...get().chatMessages, result.message] });
  }),
  createGroup: (group) => task(set, async () => {
    const result = await api.createGroup(group);
    set({ groups: [result.group, ...get().groups.filter((item) => item.id !== result.group.id)], group: result.group, acceptedMatch: null, scheduleSuggestions: [], session: null, chatMessages: [] });
  }),
  joinGroup: (groupId) => task(set, async () => {
    const result = await api.joinGroup(groupId);
    set({
      groups: [result.group, ...get().groups.filter((item) => item.id !== result.group.id)],
      group: result.group,
      discoverableGroups: get().discoverableGroups.filter((item) => item.id !== groupId),
      acceptedMatch: null,
      scheduleSuggestions: [],
      session: null,
      chatMessages: []
    });
  }),
  leaveGroup: () => task(set, async () => {
    const group = get().group;
    const user = get().user;
    if (!group || !user) return;
    await api.leaveGroup(group.id);
    const workflow = await api.loadWorkflow();
    set({
      ...workflowState(user, workflow),
      scheduleSuggestions: [],
      progress: null,
      guidance: [],
      chatMessages: []
    });
  }),
  joinAcceptedGroup: () => task(set, async () => {
    const match = get().acceptedMatch;
    const user = get().user;
    if (!match || !user) throw new Error('Accept a match before joining its study group.');
    const groupResult = await api.createGroup({
      groupName: `${match.course} Study Group`,
      purpose: 'Matched Study Group',
      candidateUserId: match.candidateUserId,
      conversationId: match.conversationId,
      rules: ['Respect the existing group plan.', 'Attend confirmed sessions.', 'Contribute to the shared study goal.'],
      studyTarget: match.studyGoal,
      meetingStyle: match.studyPreference === 'pair' ? 'Pair Study' : 'Group Study'
    });
    const scheduleResult = await api.generateSchedule(groupResult.group.id);
    const firstSlot = scheduleResult.suggestions[0];
    const sessionResult = await api.confirmSession({
      groupId: groupResult.group.id,
      date: firstSlot.date,
      time: firstSlot.time,
      topic: `${match.course} Study Session`,
      studyGoal: match.studyGoal
    });
    set({ groups: [groupResult.group, ...get().groups.filter((item) => item.id !== groupResult.group.id)], group: groupResult.group, session: sessionResult.session, scheduleSuggestions: [] });
  }),
  generateSchedule: () => task(set, async () => { const group = get().group; if (!group) return; const result = await api.generateSchedule(group.id); set({ scheduleSuggestions: result.suggestions }); }),
  confirmSession: (slot) => task(set, async () => {
    const group = get().group; if (!group) return;
    const fallback = get().scheduleSuggestions[0] || (await api.generateSchedule(group.id)).suggestions[0];
    const result = await api.confirmSession({ groupId: group.id, date: slot?.date || fallback.date, time: slot?.time || fallback.time, topic: `${group.purpose} Session` });
    set({ session: result.session });
  }),
  markAttendance: () => task(set, async () => {
    const session = get().session;
    if (!session) return;
    await api.markAttendance(session.id);
    const completedSession = { ...session, status: 'completed' as const };
    set({
      session: completedSession,
      sessionHistory: [completedSession, ...get().sessionHistory.filter((item) => item.id !== completedSession.id)]
    });
  }),
  trackAccountability: () => task(set, async () => { const group = get().group; if (!group) return; const result = await api.trackAccountability(group.id); set({ accountability: result.accountability }); }),
  loadProgress: () => task(set, async () => { if (!get().user) return; const result = await api.loadProgress(); set({ progress: result.progress }); }),
  loadGuidance: () => task(set, async () => { if (!get().user) return; const result = await api.loadGuidance(); set({ guidance: result.guidance }); }),
  pauseActivity: () => task(set, async () => { await api.pause(); }),
  addLibraryFile: (file) => {
    const userId = get().user?.id;
    if (!userId) return;
    const libraryFiles = [file, ...get().libraryFiles.filter((item) => item.id !== file.id)];
    set({ libraryFiles, libraryFilesByUser: { ...get().libraryFilesByUser, [userId]: libraryFiles } });
  },
  removeLibraryFile: (fileId) => {
    const userId = get().user?.id;
    if (!userId) return;
    const libraryFiles = get().libraryFiles.filter((item) => item.id !== fileId);
    set({ libraryFiles, libraryFilesByUser: { ...get().libraryFilesByUser, [userId]: libraryFiles } });
  },
  clearError: () => set({ error: null })
}), {
  name: 'studysync-session',
  partialize: (state) => ({ user: state.user, profile: state.profile, groupRequirements: state.groupRequirements, matches: state.matches, discoverableGroups: state.discoverableGroups, acceptedMatch: state.acceptedMatch, groups: state.groups, group: state.group, scheduleSuggestions: state.scheduleSuggestions, session: state.session, accountability: state.accountability, progress: state.progress, guidance: state.guidance, chatMessages: state.chatMessages, libraryFilesByUser: state.libraryFilesByUser, sessionHistory: state.sessionHistory })
}));
