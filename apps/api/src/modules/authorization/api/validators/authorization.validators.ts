import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

function makeValidator(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  };
}

const createPermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional().default(null),
});

const updatePermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional().default(null),
});

const createGrantSchema = z.object({
  permissionId: z.string().uuid(),
  contextLevel: z.enum(['Platform', 'Community', 'Event']),
  contextId: z.string().uuid().nullable().optional().default(null),
  responsibilityRef: z.object({
    type: z.enum(['CommunityPosition', 'CommitteeRole', 'PlatformAdmin']),
    id: z.string().min(1),
  }),
});

const evaluateSchema = z.object({
  permissionName: z.string().min(1),
  contextLevel: z.enum(['Platform', 'Community', 'Event']),
  contextId: z.string().uuid().nullable().optional().default(null),
  responsibilityRefs: z.array(
    z.object({
      type: z.enum(['CommunityPosition', 'CommitteeRole', 'PlatformAdmin']),
      id: z.string().min(1),
    }),
  ).min(1),
});

export const validateCreatePermission = makeValidator(createPermissionSchema);
export const validateUpdatePermission = makeValidator(updatePermissionSchema);
export const validateCreateGrant = makeValidator(createGrantSchema);
export const validateEvaluate = makeValidator(evaluateSchema);
