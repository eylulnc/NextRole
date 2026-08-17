import type { ApplicationStatus } from "../types/application";

const STAGE_META: Record<ApplicationStatus, { label: string; hue: number }> = {
	SAVED: { label: "Saved", hue: 230 },
	APPLIED: { label: "Applied", hue: 200 },
	HR_INTERVIEW: { label: "HR Interview", hue: 280 },
	TECHNICAL: { label: "Technical", hue: 310 },
	FINAL: { label: "Final Round", hue: 20 },
	OFFER: { label: "Offer", hue: 150 },
	REJECTED: { label: "Rejected", hue: 0 },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
	const meta = STAGE_META[status];
	return (
		<span
			style={{
				fontSize: 11,
				fontWeight: 600,
				padding: "4px 10px",
				borderRadius: 20,
				background: `oklch(93% 0.03 ${meta.hue})`,
				color: `oklch(40% 0.11 ${meta.hue})`,
				whiteSpace: "nowrap",
			}}
		>
			{meta.label}
		</span>
	);
}

export function statusOptions(): { value: ApplicationStatus; label: string }[] {
	return (Object.keys(STAGE_META) as ApplicationStatus[]).map((value) => ({
		value,
		label: STAGE_META[value].label,
	}));
}
