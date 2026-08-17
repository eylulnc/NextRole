import i18n from "../i18n/config";

export function workModeLabel(mode: string | null | undefined): string | null {
	if (!mode) return null;
	return i18n.t(`applicationForm.workModeOptions.${mode}`);
}

export function formatLocation(location: string | null | undefined, workMode: string | null | undefined): string | null {
	const parts = [location, workModeLabel(workMode)].filter(Boolean);
	return parts.length > 0 ? parts.join(" · ") : null;
}
