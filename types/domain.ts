export type MetricBlueprint = {
  key: string;
  value: string;
  delta: string;
};

export type InsightBlueprint = {
  key: string;
  severity: "good" | "warning" | "critical";
  value: string;
};

export type FilterBlueprint = {
  key: string;
};
