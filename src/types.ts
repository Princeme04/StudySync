export type StudyPreference = 'solo' | 'pair' | 'group';
export type LearningStyle = 'visual' | 'reading' | 'discussion' | 'practice' | 'mixed';

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

export interface GroupRequirements {
  course: string;
  studyGoal: string;
  preferredTime: string;
  learningStyle: string;
  studyPreference: StudyPreference;
  groupSize: string;
  notes: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  className: string;
  isPro: boolean;
  createdAt: string;
}

export interface StudentProfile {
  id?: string;
  userId?: string;
  fullName: string;
  email: string;
  course?: string;
  subject?: string;
  university: string;
  className?: string;
  major: string;
  studyGoal: string;
  preferredStudyTime?: string;
  learningStyle?: LearningStyle;
  learningStyles: string[];
  availability?: Availability[];
  studyPreference: StudyPreference;
  timeOfDay: string[];
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudyMatch {
  id: string;
  userId: string;
  candidateUserId?: string;
  conversationId?: string;
  candidateName: string;
  candidateUniversity: string;
  course: string;
  studyGoal: string;
  availableTime: string;
  learningStyle: string;
  studyPreference: StudyPreference;
  matchPercentage: number;
  matchReason: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  avatarUrl?: string;
}

export interface MatchOption {
  id: string;
  groupId?: string;
  name: string;
  type: 'individual' | 'group';
  matchPercentage: number;
  course: string;
  subject: string;
  tags: string[];
  avatarUrl?: string;
  memberCount?: number;
  matchReason?: string;
}

export interface DiscoverableStudyGroup extends StudyGroup {
  ownerName: string;
  course: string;
  preferredStudyTime: string;
  learningStyle: string;
  studyPreference: StudyPreference;
  memberCount: number;
}

export interface StudyGroup {
  id: string;
  userId: string;
  conversationId?: string;
  groupName: string;
  purpose: string;
  members: string[];
  rules: string[];
  studyTarget: string;
  meetingStyle: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreateStudyGroupInput extends Partial<StudyGroup> {
  candidateUserId?: string;
  conversationId?: string;
}

export interface StudySession {
  id: string;
  groupId?: string;
  groupName?: string;
  subject?: string;
  date: string;
  time: string;
  dateTime?: string;
  topic: string;
  members: string[];
  studyGoal: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'missed' | 'active';
  reminderActive: boolean;
  createdAt: string;
  attendanceRate?: number;
  taskCompletion?: number;
}

export interface ScheduleSuggestion {
  id: string;
  day: string;
  date: string;
  time: string;
  availability: number;
  memberCount: number;
  isOptimal: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  name: string;
  status: 'joined' | 'late' | 'missed';
  joinedAt: string | null;
}

export interface AccountabilityRecord {
  id: string;
  groupId: string;
  userId: string;
  attendanceRate: number;
  sessionsMissed: number;
  participationScore: number;
  isInactive: boolean;
  suggestedAction: string;
}

export interface ProgressAnalytics {
  id: string;
  userId: string;
  sessionsCompleted: number;
  attendanceHistory: number[];
  groupActivityLevel: string;
  studyConsistency: string;
  mostActiveStudyTime: string;
  totalStudyHours: number;
  completedSessions: number;
  progressTrackingRate: number;
}

export interface GuidanceItem {
  id: string;
  userId: string;
  type: string;
  message: string;
  actionLabel: string;
  actionTarget: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface LibraryFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
}

export interface Metrics {
  visitors: number;
  newUsers: number;
  profileCompletionRate: number;
  possibleMatchesFound: number;
  successfulMatches: number;
  studyGroupsCreated: number;
  sessionsScheduled: number;
  confirmedStudySessions: number;
  attendanceRate: number;
  completedSessions: number;
  churnRate: number;
  [key: string]: number;
}

export interface ActivityLog {
  day: string;
  hours: number;
  completed: boolean;
}
