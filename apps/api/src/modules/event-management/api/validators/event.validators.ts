import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

function makeValidator(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  };
}

const createEventSchema = z.object({
  communityId: z.string().uuid(),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).nullable().optional(),
  mode: z.enum(['Online', 'Offline', 'Hybrid']).optional(),
  visibility: z.enum(['Public', 'Private', 'InviteOnly']).optional(),
});

const updateEventSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  mode: z.enum(['Online', 'Offline', 'Hybrid']).optional(),
  visibility: z.enum(['Public', 'Private', 'InviteOnly']).optional(),
  location: z.object({
    venue: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    onlineUrl: z.string().url().nullable().optional(),
  }).optional(),
  capacity: z.object({
    min: z.number().int().min(0).nullable().optional(),
    max: z.number().int().min(1).nullable().optional(),
  }).optional(),
  pricing: z.object({
    isPaid: z.boolean().optional(),
    // Minor units (paise). Cap at ₹10,00,000 to catch a rupee/paise mix-up.
    amount: z.number().int().min(0).max(100_000_000).nullable().optional(),
    currency: z.enum(['INR']).optional(),
  }).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  settings: z.object({
    requireApproval: z.boolean().optional(),
    allowWaitlist: z.boolean().optional(),
    showAttendeeList: z.boolean().optional(),
    allowGuestRegistration: z.boolean().optional(),
  }).optional(),
});

const transitionSchema = z.object({
  targetState: z.enum([
    'Published', 'RegistrationOpen', 'RegistrationClosed',
    'Live', 'Completed', 'Archived', 'Cancelled',
  ]),
});

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
});

const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  speaker: z.string().max(200).nullable().optional(),
  room: z.string().max(200).nullable().optional(),
});

const scheduleSessionSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const validateCreateEvent = makeValidator(createEventSchema);
export const validateUpdateEvent = makeValidator(updateEventSchema);
export const validateTransition = makeValidator(transitionSchema);
export const validateCreateSession = makeValidator(createSessionSchema);
export const validateUpdateSession = makeValidator(updateSessionSchema);
export const validateScheduleSession = makeValidator(scheduleSessionSchema);
