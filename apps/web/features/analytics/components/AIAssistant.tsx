"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { getAIInsight } from "../api/analyticsClient";
import type { AIInsightResponse } from "../types";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action.type}
            onClick={() => handleQuickAction(action.type, action.label)}
            disabled={loading}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-50"
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
          placeholder="Ask about your event…"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button onClick={handleAsk} disabled={loading || !query.trim()}>
          {loading ? (
            "Thinking…"
          ) : (
            <>
              <Send className="size-3.5" />
              Ask
            </>
          )}
        </Button>
      </div>

      {response && (
        <FadeIn>
          <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-white">
                <Sparkles className="size-3" />
              </span>
              AI Insight
            </div>
            <p className="whitespace-pre-wrap text-sm">{response.content}</p>
            {response.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                <ul className="space-y-1">
                  {response.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 text-primary">&bull;</span>
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
