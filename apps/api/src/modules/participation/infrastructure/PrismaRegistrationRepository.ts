import type { PrismaClient } from "@prisma/client";
import type { RegistrationRepository } from "../domain/RegistrationRepository";
import { Registration, type RegistrationQuestion } from "../domain/Registration";
import type { ApprovalStrategy } from "../domain/valueObjects/ApprovalStrategy";
import type { RegistrationWindow } from "../domain/valueObjects/RegistrationWindow";

function toDomain(row: {
  id: string;
  eventId: string;
  approvalStrategy: string;
  windowOpensAt: Date | null;
  windowClosesAt: Date | null;
  maxParticipants: number | null;
  allowWaitlist: boolean;
  isOpen: boolean;
  questions: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Registration {
  let window: RegistrationWindow | null = null;
  if (row.windowOpensAt && row.windowClosesAt) {
    window = { opensAt: row.windowOpensAt, closesAt: row.windowClosesAt };
  }

  return new Registration({
    id: row.id,
    eventId: row.eventId,
    approvalStrategy: row.approvalStrategy as ApprovalStrategy,
    window,
    capacity: {
      maxParticipants: row.maxParticipants,
      allowWaitlist: row.allowWaitlist,
    },
    questions: (row.questions as RegistrationQuestion[]) ?? [],
    isOpen: row.isOpen,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaRegistrationRepository implements RegistrationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Registration | null> {
    const row = await this.prisma.registration.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEventId(eventId: string): Promise<Registration | null> {
    const row = await this.prisma.registration.findUnique({ where: { eventId } });
    return row ? toDomain(row) : null;
  }

  async save(reg: Registration): Promise<void> {
    await this.prisma.registration.create({
      data: {
        id: reg.id,
        eventId: reg.eventId,
        approvalStrategy: reg.approvalStrategy,
        windowOpensAt: reg.window?.opensAt ?? null,
        windowClosesAt: reg.window?.closesAt ?? null,
        maxParticipants: reg.capacity.maxParticipants,
        allowWaitlist: reg.capacity.allowWaitlist,
        isOpen: reg.isOpen,
        questions: reg.questions as object[],
      },
    });
  }

  async update(reg: Registration): Promise<void> {
    await this.prisma.registration.update({
      where: { id: reg.id },
      data: {
        approvalStrategy: reg.approvalStrategy,
        windowOpensAt: reg.window?.opensAt ?? null,
        windowClosesAt: reg.window?.closesAt ?? null,
        maxParticipants: reg.capacity.maxParticipants,
        allowWaitlist: reg.capacity.allowWaitlist,
        isOpen: reg.isOpen,
        questions: reg.questions as object[],
        updatedAt: reg.updatedAt,
      },
    });
  }
}
