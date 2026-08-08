import { z } from "zod";
import { Request, Response, NextFunction } from "express";

function makeValidator(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  };
}

const createCommitteeSchema = z.object({
  eventId: z.string().uuid(),
  communityId: z.string().uuid(),
  name: z.string().min(2).max(200),
});

const addRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
});

const setReportingSchema = z.object({
  reportsToRoleId: z.string().uuid().nullable(),
});

const assignMemberSchema = z.object({
  roleId: z.string().uuid(),
  userId: z.string().uuid(),
});

const transitionSchema = z.object({
  targetState: z.enum(["Formation", "Active", "Completed", "Archived"]),
});

export const validateCreateCommittee = makeValidator(createCommitteeSchema);
export const validateAddRole = makeValidator(addRoleSchema);
export const validateUpdateRole = makeValidator(updateRoleSchema);
export const validateSetReporting = makeValidator(setReportingSchema);
export const validateAssignMember = makeValidator(assignMemberSchema);
export const validateTransition = makeValidator(transitionSchema);
