import { randomUUID } from "node:crypto";
import type { ApprovalStrategy } from "./valueObjects/ApprovalStrategy";
import {
  type RegistrationWindow,
  isWindowOpen,
  validateWindow,
} from "./valueObjects/RegistrationWindow";
import type { CapacityPolicy } from "./valueObjects/CapacityPolicy";

export interface RegistrationQuestion {
  id: string;
  label: string;
  type: "Text" | "Number" | "Select" | "MultiSelect" | "File" | "Date";
  required: boolean;
  options: string[];
  order: number;
}

export interface RegistrationProps {
  id: string;
  eventId: string;
  approvalStrategy: ApprovalStrategy;
  window: RegistrationWindow | null;
  capacity: CapacityPolicy;
  questions: RegistrationQuestion[];
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Registration {
  readonly id: string;
  readonly eventId: string;
  approvalStrategy: ApprovalStrategy;
  window: RegistrationWindow | null;
  capacity: CapacityPolicy;
  questions: RegistrationQuestion[];
  isOpen: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: RegistrationProps) {
    this.id = props.id;
    this.eventId = props.eventId;
    this.approvalStrategy = props.approvalStrategy;
    this.window = props.window;
    this.capacity = props.capacity;
    this.questions = props.questions;
    this.isOpen = props.isOpen;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(eventId: string, approvalStrategy: ApprovalStrategy = "Automatic"): Registration {
    return new Registration({
      id: randomUUID(),
      eventId,
      approvalStrategy,
      window: null,
      capacity: { maxParticipants: null, allowWaitlist: false },
      questions: [],
      isOpen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  open(): void {
    this.isOpen = true;
    this.updatedAt = new Date();
  }

  close(): void {
    this.isOpen = false;
    this.updatedAt = new Date();
  }

  canAcceptEnrollment(currentCount: number, now: Date = new Date()): boolean {
    if (!this.isOpen) return false;
    if (this.window && !isWindowOpen(this.window, now)) return false;
    if (this.capacity.maxParticipants !== null && currentCount >= this.capacity.maxParticipants) {
      return this.capacity.allowWaitlist;
    }
    return true;
  }

  isAtCapacity(currentCount: number): boolean {
    return this.capacity.maxParticipants !== null && currentCount >= this.capacity.maxParticipants;
  }

  setWindow(window: RegistrationWindow): void {
    validateWindow(window);
    this.window = window;
    this.updatedAt = new Date();
  }

  setCapacity(capacity: CapacityPolicy): void {
    if (capacity.maxParticipants !== null && capacity.maxParticipants < 1) {
      throw new Error("Max participants must be at least 1");
    }
    this.capacity = capacity;
    this.updatedAt = new Date();
  }

  addQuestion(
    label: string,
    type: RegistrationQuestion["type"],
    required: boolean = false,
    options: string[] = [],
  ): RegistrationQuestion {
    const question: RegistrationQuestion = {
      id: randomUUID(),
      label,
      type,
      required,
      options,
      order: this.questions.length,
    };
    this.questions.push(question);
    this.updatedAt = new Date();
    return question;
  }

  removeQuestion(questionId: string): void {
    this.questions = this.questions.filter((q) => q.id !== questionId);
    this.questions.forEach((q, i) => (q.order = i));
    this.updatedAt = new Date();
  }

  updateConfig(update: {
    approvalStrategy?: ApprovalStrategy;
  }): void {
    if (update.approvalStrategy) this.approvalStrategy = update.approvalStrategy;
    this.updatedAt = new Date();
  }
}
