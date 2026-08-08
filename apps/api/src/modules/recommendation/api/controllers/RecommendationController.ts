import type { Request, Response } from "express";
import type { AIAssistantService } from "../../application/AIAssistantService";
import type { InsightType } from "../../domain/RecommendationRequest";

export class RecommendationController {
  constructor(private readonly service: AIAssistantService) {}

  getInsight = async (req: Request, res: Response): Promise<void> => {
    const { type, contextId, contextType, query, additionalContext } = req.body;
    const result = await this.service.getInsight({
      type: type as InsightType,
      contextId,
      contextType,
      query,
      additionalContext,
    });
    res.json(result);
  };

  getEventSummary = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    const result = await this.service.getInsight({
      type: "EventSummary",
      contextId: eventId,
      contextType: "Event",
      query: "Provide a summary of this event's performance and status.",
    });
    res.json(result);
  };

  getRegistrationInsight = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    const result = await this.service.getInsight({
      type: "RegistrationInsight",
      contextId: eventId,
      contextType: "Event",
      query: "Analyze registration trends and provide recommendations.",
    });
    res.json(result);
  };

  getAttendanceInsight = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    const result = await this.service.getInsight({
      type: "AttendanceInsight",
      contextId: eventId,
      contextType: "Event",
      query: "Analyze attendance patterns and suggest improvements.",
    });
    res.json(result);
  };

  getTaskSuggestions = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    const result = await this.service.getInsight({
      type: "TaskSuggestion",
      contextId: eventId,
      contextType: "Event",
      query: "Suggest task assignments and optimizations.",
    });
    res.json(result);
  };
}
