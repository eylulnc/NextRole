import { useTheme } from "../context/ThemeContext";
import { usePipelineStages } from "../context/PipelineStagesContext";
import type { PipelineStage } from "../api/pipelineStages";

export function StatusBadge({ status }: { status: string }) {
	const { resolvedTheme } = useTheme();
	const { stages } = usePipelineStages();
	const stage = stages.find((s) => s.key === status);
	const hue = stage?.hue ?? 0;
	const isDark = resolvedTheme === "dark";
	return (
		<span
			style={{
				fontSize: 11,
				fontWeight: 600,
				padding: "4px 10px",
				borderRadius: 20,
				background: isDark ? `oklch(32% 0.09 ${hue})` : `oklch(93% 0.03 ${hue})`,
				color: isDark ? `oklch(88% 0.14 ${hue})` : `oklch(40% 0.11 ${hue})`,
				whiteSpace: "nowrap",
			}}
		>
			{stage?.label ?? status}
		</span>
	);
}

export function statusOptions(stages: PipelineStage[]): { value: string; label: string }[] {
	return stages.map((s) => ({ value: s.key, label: s.label }));
}

export function statusDotColor(status: string, stages: PipelineStage[]): string {
	const hue = stages.find((s) => s.key === status)?.hue ?? 0;
	return `oklch(60% 0.13 ${hue})`;
}

export function stageLabel(status: string, stages: PipelineStage[]): string {
	return stages.find((s) => s.key === status)?.label ?? status;
}
