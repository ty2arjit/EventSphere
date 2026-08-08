import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createCommunitySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).nullable().optional().default(null),
});

const updateCommunitySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
});

const createPositionSchema = z.object({
  name: z.string().trim().min(1, 'Position name is required').max(100),
  description: z.string().max(500).nullable().optional().default(null),
  allowsMultipleHolders: z.boolean().optional().default(false),
});

const updatePositionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).nullable().optional().default(null),
  allowsMultipleHolders: z.boolean().optional().default(false),
});

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email'),
});

const updateSettingsSchema = z.object({
  isPublic: z.boolean().optional(),
  allowMemberInvitations: z.boolean().optional(),
  invitationExpiryDays: z.number().int().min(1).max(90).optional(),
  defaultMemberRole: z.string().nullable().optional(),
});

function makeValidator(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: result.error.flatten(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const validateCreateCommunity = makeValidator(createCommunitySchema);
export const validateUpdateCommunity = makeValidator(updateCommunitySchema);
export const validateCreatePosition = makeValidator(createPositionSchema);
export const validateUpdatePosition = makeValidator(updatePositionSchema);
export const validateCreateInvitation = makeValidator(createInvitationSchema);
export const validateUpdateSettings = makeValidator(updateSettingsSchema);
