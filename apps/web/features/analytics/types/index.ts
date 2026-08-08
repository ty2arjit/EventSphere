export interface EventDashboard {
  totalEnrollments: number;
  averageAttendance: number;
  certificatesIssued: number;
  taskCompletionRate: number;
  metricCount: number;
}

export interface AIInsightResponse {
  type: string;
  content: string;
  suggestions: string[];
  confidence: number;
  generatedAt: string;
}
