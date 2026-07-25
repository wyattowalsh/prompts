import {
  Binary,
  BookOpen,
  Bot,
  Brain,
  Code2,
  LineChart,
  Package,
  PenLine,
  type LucideIcon
} from "lucide-react";

const LANE_ICONS: Record<string, LucideIcon> = {
  research: BookOpen,
  writing: PenLine,
  coding: Code2,
  data: Binary,
  product: Package,
  operations: LineChart,
  agents: Bot,
  reasoning: Brain
};

export function laneIcon(laneKey: string, size = 14) {
  const Icon = LANE_ICONS[laneKey] ?? BookOpen;
  return <Icon size={size} strokeWidth={2.1} aria-hidden="true" />;
}
