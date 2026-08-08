export type InsightType =
  | "EventSummary"
  | "RegistrationInsight"
  | "AttendanceInsight"
  | "AnalyticsRecommendation"
  | "TaskSuggestion"
  | "GeneralQuery";

export interface RecommendationRequest {
  type: InsightType;
  contextId: string;
  contextType: string;
  query: string;
  additionalContext?: Record<string, unknown>;
}

export interface RecommendationResponse {
  type: InsightType;
  content: string;
  suggestions: string[];
  confidence: number;
  generatedAt: Date;
}
