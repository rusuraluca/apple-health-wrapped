export interface HealthMetrics {
  steps: {
    total: number;
    average: number;      // per active day
    bestMonth: string;    // "YYYY-MM (123,456 steps)"
    monthlyData: { month: string; value: number }[];
  };
  workouts: {
    total: number;
    types: Record<string, number>;
    totalMinutes: number;
  };
  sleep: {
    averageHours: number;
    totalHours: number;
    bestMonth: string;
  };
  heartRate: {
    average: number;
    resting: number;
  };
  activeEnergy: {
    total: number;
    average: number;
  };
  mindfulMinutes: {
    total: number;
    sessions: number;
  };
  insights: {
    topAchievement: string;
    funFact: string;
    yearComparison: string;
  };
}

const API_URL =
  import.meta?.env?.VITE_HEALTH_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export async function parseAppleHealthXML(file: File): Promise<HealthMetrics> {
  const fd = new FormData();
  fd.append("file", file, file.name);

  const res = await fetch(`${API_URL}/parse`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend parse failed (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as HealthMetrics;
  return data;
}