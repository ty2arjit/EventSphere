import { z } from "zod";
import { Request, Response, NextFunction } from "express";

function makeValidator(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  };
}

const createRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  approvalStrategy: z.enum(["Automatic", "Manual", "InvitationOnly"]).optional(),
});

const updateRegistrationSchema = z.object({
  approvalStrategy: z.enum(["Automatic", "Manual", "InvitationOnly"]).optional(),
  window: z
    .object({
      opensAt: z.string().datetime(),
      closesAt: z.string().datetime(),
    })
    .optional(),
  capacity: z
    .object({
      maxParticipants: z.number().int().min(1).nullable(),
      allowWaitlist: z.boolean(),
    })
    .optional(),
});

const addQuestionSchema = z.object({
  label: z.string().min(1).max(200),
  type: z.enum(["Text", "Number", "Select", "MultiSelect", "File", "Date"]),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

const enrollSchema = z.object({
  eventId: z.string().uuid(),
  responses: z
    .array(z.object({ questionId: z.string().uuid(), value: z.string() }))
    .optional()
    .default([]),
});

const reviewSchema = z.object({
  reviewerId: z.string().uuid(),
});

const checkInByQrSchema = z.object({
  token: z.string().min(1),
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export const validateCreateRegistration = makeValidator(createRegistrationSchema);
export const validateUpdateRegistration = makeValidator(updateRegistrationSchema);
export const validateAddQuestion = makeValidator(addQuestionSchema);
export const validateEnroll = makeValidator(enrollSchema);
export const validateReview = makeValidator(reviewSchema);
export const validateCheckInByQr = makeValidator(checkInByQrSchema);
