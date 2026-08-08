"use client";

import { useState } from "react";
import { getAIInsight } from "../api/analyticsClient";
import type { AIInsightResponse } from "../types";
import { FadeIn } from "@/components/motion/FadeIn";

interface AIAssistantProps {
  eventId: string;
}

export function AIAssistant({ eventId }: AIAssistantProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AIInsightResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const result = await getAIInsight({
      type: "GeneralQuery",
      contextId: eventId,
      contextType: "Event",
      query: query.trim(),
    });
    if (result.ok) {
      setResponse(result.data);
    }
    setLoading(false);
  };

  const quickActions = [
    { label: "Event Summary", type: "EventSummary" },
    { label: "Registration Insights", type: "RegistrationInsight" },
    { label: "Attendance Analysis", type: "AttendanceInsight" },
    { label: "Task Suggestions", type: "TaskSuggestion" },
  ];

  const handleQuickAction = async (type: string, label: string) => {
    setLoading(true);
    setResponse(null);
    setQuery(label);
    const result = await getAIInsight({
      type,
      contextId: eventId,
      contextType: "Event",
      query: `Provide ${label.toLowerCase()} for this event.`,
    });
    if (result.ok) {
      setResponse(result.data);
    }
    setLoading(false);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
          AI
        </span>
        AI Assistant
      </h3>

      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action.type}
            onClick={() => handleQuickAction(action.type, action.label)}
            disabled={loading}
            className="px-3 py-1 text-xs border rounded-full hover:bg-muted disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask about your event..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      {response && (
        <FadeIn>
          <div className="space-y-3 border-t pt-3">
            <p className="text-sm whitespace-pre-wrap">{response.content}</p>
            {response.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                <ul className="space-y-1">
                  {response.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">&bull;</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Confidence: {Math.round(response.confidence * 100)}%
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
