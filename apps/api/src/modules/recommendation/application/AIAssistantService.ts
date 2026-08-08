import type {
  RecommendationRequest,
  RecommendationResponse,
} from "../domain/RecommendationRequest";
import type { AnalyticsService } from "../../analytics/application/AnalyticsService";
import { logger } from "../../../shared/logger";

export class AIAssistantService {
  private readonly apiKey: string | undefined;

  constructor(
    private readonly analyticsService: AnalyticsService,
    apiKey?: string,
  ) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY;
  }

  async getInsight(request: RecommendationRequest): Promise<RecommendationResponse> {
    const contextData = await this.gatherContext(request);
    const prompt = this.buildPrompt(request, contextData);

    if (!this.apiKey) {
      return this.generateFallbackResponse(request, contextData);
    }

    try {
      const result = await this.callGemini(prompt);
      return {
        type: request.type,
        content: result.content,
        suggestions: result.suggestions,
        confidence: result.confidence,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error }, "Gemini API call failed, using fallback");
      return this.generateFallbackResponse(request, contextData);
    }
  }

  private async gatherContext(
    request: RecommendationRequest,
  ): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {};

    if (request.contextType === "Event") {
      try {
        const dashboard = await this.analyticsService.getEventDashboard(request.contextId);
        context.dashboard = dashboard;
      } catch {
        context.dashboard = null;
      }

      try {
        const metrics = await this.analyticsService.getEntityMetrics(request.contextId);
        context.recentMetrics = metrics.slice(0, 20);
      } catch {
        context.recentMetrics = [];
      }
    }

    if (request.additionalContext) {
      Object.assign(context, request.additionalContext);
    }

    return context;
  }

  private buildPrompt(
    request: RecommendationRequest,
    context: Record<string, unknown>,
  ): string {
    const systemPrompt = `You are an AI assistant for EventSphere, a college event management platform.
You help organizers with insights about their events, registrations, attendance, and tasks.
Respond concisely and actionably. Always provide 2-3 specific suggestions.`;

    const contextStr = JSON.stringify(context, null, 2);

    return `${systemPrompt}

Type: ${request.type}
Context: ${request.contextType} (${request.contextId})
Query: ${request.query}

Available Data:
${contextStr}

Provide a helpful response with actionable suggestions.`;
  }

  private async callGemini(
    prompt: string,
  ): Promise<{ content: string; suggestions: string[]; confidence: number }> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated.";

    const lines = text.split("\n").filter((l: string) => l.trim());
    const suggestions = lines
      .filter((l: string) => l.match(/^[-•*]\s/))
      .map((l: string) => l.replace(/^[-•*]\s/, "").trim())
      .slice(0, 5);

    return {
      content: text,
      suggestions: suggestions.length > 0 ? suggestions : ["Review the data for more details"],
      confidence: 0.8,
    };
  }

  private generateFallbackResponse(
    request: RecommendationRequest,
    context: Record<string, unknown>,
  ): RecommendationResponse {
    const dashboard = context.dashboard as {
      totalEnrollments?: number;
      averageAttendance?: number;
      certificatesIssued?: number;
      taskCompletionRate?: number;
    } | null;

    let content: string;
    const suggestions: string[] = [];

    switch (request.type) {
      case "EventSummary":
        content = dashboard
          ? `Event has ${dashboard.totalEnrollments ?? 0} enrollments with ${Math.round((dashboard.averageAttendance ?? 0) * 100)}% average attendance.`
          : "No analytics data available yet for this event.";
        suggestions.push("Add more sessions to increase engagement");
        suggestions.push("Send announcements to boost attendance");
        break;

      case "RegistrationInsight":
        content = dashboard
          ? `${dashboard.totalEnrollments ?? 0} participants enrolled so far.`
          : "Registration data is not yet available.";
        suggestions.push("Consider extending the registration window");
        suggestions.push("Share the event on community channels");
        break;

      case "AttendanceInsight":
        content = dashboard
          ? `Average attendance rate: ${Math.round((dashboard.averageAttendance ?? 0) * 100)}%.`
          : "No attendance data recorded yet.";
        suggestions.push("Send reminders before sessions");
        suggestions.push("Consider incentivizing attendance with certificates");
        break;

      case "TaskSuggestion":
        content = dashboard
          ? `Task completion rate: ${Math.round((dashboard.taskCompletionRate ?? 0) * 100)}%.`
          : "No task data available.";
        suggestions.push("Break large tasks into smaller subtasks");
        suggestions.push("Assign critical tasks to experienced volunteers");
        break;

      default:
        content = "I can help with event summaries, registration insights, attendance analysis, and task suggestions.";
        suggestions.push("Try asking about event performance");
        suggestions.push("Ask for registration or attendance insights");
        break;
    }

    return {
      type: request.type,
      content,
      suggestions,
      confidence: 0.5,
      generatedAt: new Date(),
    };
  }
}
