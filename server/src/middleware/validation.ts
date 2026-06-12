import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from './errors.ts';

const identifier = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/, 'Invalid identifier.');
const shortText = z.string().trim().min(1).max(200);
const longText = z.string().trim().min(1).max(2_000);
const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(128);
const timeRange = z.string().trim().regex(/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/, 'Use a time range such as 18:00 - 20:00.');
const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an ISO date such as 2026-07-01.');
const futureDate = isoDate.refine((value) => value >= new Date().toISOString().slice(0, 10), 'Session date cannot be in the past.');

const validationMessage = (error: z.ZodError) => error.issues
  .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
  .join('; ');

const validate = (target: 'body' | 'params', schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req[target]);
  if (!result.success) return next(new AppError(validationMessage(result.error), 400, 'validation_error'));
  req[target] = result.data as never;
  next();
};

export const validateBody = (schema: z.ZodType) => validate('body', schema);
export const validateParams = (schema: z.ZodType) => validate('params', schema);

export const schemas = {
  register: z.object({
    name: shortText.optional(),
    fullName: shortText.optional(),
    email,
    password
  }).refine((value) => Boolean(value.name || value.fullName), { message: 'Name is required.', path: ['name'] }),
  login: z.object({ email, password: z.string().min(1).max(128) }),
  passwordResetRequest: z.object({ email }),
  passwordResetConfirm: z.object({ token: z.string().trim().min(16).max(512), password }),
  profile: z.object({
    id: identifier.optional(),
    userId: identifier.optional(),
    fullName: z.string().trim().max(200).optional(),
    email: z.union([email, z.literal('')]).optional(),
    course: shortText.optional(),
    subject: shortText.optional(),
    university: shortText,
    className: z.string().trim().max(200).optional(),
    major: shortText.optional(),
    studyGoal: shortText,
    preferredStudyTime: shortText.optional(),
    learningStyle: shortText.optional(),
    learningStyles: z.array(shortText).min(1).max(5).optional(),
    availability: z.array(z.object({
      day: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/)
    }).refine((slot) => slot.startTime < slot.endTime, { message: 'Availability end time must be after start time.' })).max(14).optional(),
    studyPreference: z.enum(['solo', 'pair', 'group']),
    timeOfDay: z.array(shortText).min(1).max(5).optional(),
    profileCompleted: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
  }).superRefine((value, context) => {
    if (!value.major && !value.course) context.addIssue({ code: 'custom', path: ['major'], message: 'Major or course is required.' });
    if (!value.learningStyle && !value.learningStyles?.length) context.addIssue({ code: 'custom', path: ['learningStyles'], message: 'A learning style is required.' });
    if (!value.preferredStudyTime && !value.timeOfDay?.length) context.addIssue({ code: 'custom', path: ['timeOfDay'], message: 'A preferred study time is required.' });
  }),
  requirementsEnvelope: z.object({
    requirements: z.object({
      course: shortText.optional(),
      studyGoal: shortText.optional(),
      preferredTime: shortText.optional(),
      learningStyle: shortText.optional(),
      studyPreference: z.enum(['solo', 'pair', 'group']).optional(),
      groupSize: shortText.optional(),
      notes: z.string().trim().max(1_000).optional()
    }).nullish()
  }),
  chatMessage: z.object({ conversationId: identifier, message: longText }),
  group: z.object({
    groupName: shortText.optional(),
    name: shortText.optional(),
    purpose: shortText,
    rules: z.array(shortText).max(20).optional(),
    studyTarget: shortText.optional(),
    targetGoal: shortText.optional(),
    meetingStyle: shortText,
    candidateUserId: identifier.optional(),
    conversationId: identifier.optional()
  }).superRefine((value, context) => {
    if (!value.groupName && !value.name) context.addIssue({ code: 'custom', path: ['groupName'], message: 'Group name is required.' });
    if (!value.studyTarget && !value.targetGoal) context.addIssue({ code: 'custom', path: ['studyTarget'], message: 'Study target is required.' });
  }),
  groupUpdate: z.object({
    groupName: shortText.optional(),
    name: shortText.optional(),
    purpose: shortText.optional(),
    meetingStyle: shortText.optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one group field is required.'),
  groupId: z.object({ groupId: identifier }),
  matchId: z.object({ matchId: identifier }),
  conversationId: z.object({ conversationId: identifier }),
  sessionId: z.object({ sessionId: identifier }),
  groupReference: z.object({ groupId: identifier }),
  session: z.object({
    groupId: identifier,
    date: futureDate,
    time: timeRange,
    topic: shortText.optional(),
    members: z.array(shortText).max(50).optional(),
    studyGoal: shortText.optional()
  }),
  reminder: z.object({ active: z.boolean().optional() }),
  attendance: z.object({ sessionId: identifier, status: z.enum(['joined', 'late']).default('joined') })
};
