import type {
  GuidanceItem, AccountabilityRecord, CreateStudyGroupInput, DiscoverableStudyGroup, GroupRequirements, ProgressAnalytics, StudyGroup, StudyMatch,
  ScheduleSuggestion, StudySession, StudentProfile, User, ChatMessage
} from '../types';

export interface WorkflowState {
  profile: StudentProfile | null;
  matches: StudyMatch[];
  acceptedMatch: StudyMatch | null;
  groups: StudyGroup[];
  group: StudyGroup | null;
  sessions: StudySession[];
  session: StudySession | null;
  sessionHistory: StudySession[];
  accountability: AccountabilityRecord | null;
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || (response.status >= 500
        ? 'StudySync API is unavailable. Restart the app with npm run dev.'
        : `Request failed with status ${response.status}.`));
    }
    return body as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot connect to the StudySync API. Restart the app with npm run dev.', { cause: error });
    }
    throw error;
  }
};

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

export const api = {
  register: (data: { name: string; email: string; password: string }) => post<{ user: User; expiresAt: string }>('/api/auth/register', data),
  login: (data: { email: string; password: string }) => post<{ user: User; expiresAt: string }>('/api/auth/login', data),
  me: () => request<{ user: User }>('/api/auth/me'),
  logout: () => post<{ success: true }>('/api/auth/logout'),
  logoutAll: () => post<{ success: true }>('/api/auth/logout-all'),
  requestPasswordReset: (email: string) => post<{ success: true; message: string; resetToken?: string }>('/api/auth/password-reset/request', { email }),
  confirmPasswordReset: (token: string, password: string) => post<{ success: true }>('/api/auth/password-reset/confirm', { token, password }),
  loadWorkflow: () => request<WorkflowState>('/api/workflow'),
  loadProfile: () => request<{ profile: StudentProfile }>('/api/profile'),
  saveProfile: (profile: StudentProfile) => post<{ profile: StudentProfile }>('/api/profile', profile),
  analyze: (requirements?: GroupRequirements | null) => post<{ matches: StudyMatch[] }>('/api/matching/analyze', { requirements }),
  loadMatches: () => request<{ matches: StudyMatch[] }>('/api/matches'),
  acceptMatch: (matchId: string) => post<{ match: StudyMatch; group?: StudyGroup }>(`/api/matches/${matchId}/accept`),
  rejectMatch: (matchId: string) => post<{ success: true }>(`/api/matches/${matchId}/reject`),
  rematch: (requirements?: GroupRequirements | null) => post<{ matches: StudyMatch[] }>('/api/rematch', { requirements }),
  loadChat: (conversationId: string) => request<{ messages: ChatMessage[] }>(`/api/chat/${conversationId}`),
  sendChatMessage: (conversationId: string, message: string) => post<{ message: ChatMessage }>('/api/chat/messages', { conversationId, message }),
  createGroup: (group: CreateStudyGroupInput) => post<{ group: StudyGroup }>('/api/groups', group),
  loadGroups: () => request<{ groups: StudyGroup[] }>('/api/groups'),
  discoverGroups: () => request<{ groups: DiscoverableStudyGroup[] }>('/api/groups/discover'),
  joinGroup: (groupId: string) => post<{ group: StudyGroup }>(`/api/groups/${groupId}/join`),
  leaveGroup: (groupId: string) => post<{ success: true; groupActive: boolean; newOwnerUserId: string | null }>(`/api/groups/${groupId}/leave`),
  loadSessions: (groupId: string) => request<{ sessions: StudySession[] }>(`/api/sessions/${groupId}`),
  generateSchedule: (groupId: string) => post<{ suggestions: ScheduleSuggestion[] }>('/api/schedule/generate', { groupId }),
  confirmSession: (session: Partial<StudySession>) => post<{ session: StudySession }>('/api/sessions/confirm', session),
  setReminder: (sessionId: string, active = true) => request<{ success: true }>(`/api/sessions/${sessionId}/reminder`, { method: 'PUT', body: JSON.stringify({ active }) }),
  markAttendance: (sessionId: string) => post('/api/attendance', { sessionId, status: 'joined' }),
  trackAccountability: (groupId: string) => post<{ accountability: AccountabilityRecord }>('/api/accountability/track', { groupId }),
  loadProgress: () => request<{ progress: ProgressAnalytics }>('/api/progress'),
  loadGuidance: () => request<{ guidance: GuidanceItem[] }>('/api/guidance'),
  pause: () => post('/api/user/pause')
};
