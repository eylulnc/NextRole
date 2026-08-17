import { useTranslation } from "react-i18next";
import i18n from "../i18n/config";
import type { ApplicationStatus } from "../types/application";

const STAGE_HUE: Record<ApplicationStatus, number> = {
	SAVED: 230,
	APPLIED: 200,
	HR_INTERVIEW: 280,
	TECHNICAL: 310,
	FINAL: 20,
	OFFER: 150,
	REJECTED: 0,
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
	const { t } = useTranslation();
	const hue = STAGE_HUE[status];
	return (
		<span
			style={{
				fontSize: 11,
				fontWeight: 600,
				padding: "4px 10px",
				borderRadius: 20,
				background: `oklch(93% 0.03 ${hue})`,
				color: `oklch(40% 0.11 ${hue})`,
				whiteSpace: "nowrap",
			}}
		>
			{t(`status.${status}`)}
		</span>
	);
}

export function statusHue(status: ApplicationStatus): number {
	return STAGE_HUE[status];
}

export function statusOptions(): { value: ApplicationStatus; label: string }[] {
	return (Object.keys(STAGE_HUE) as ApplicationStatus[]).map((value) => ({
		value,
		label: i18n.t(`status.${value}`),
	}));
}
