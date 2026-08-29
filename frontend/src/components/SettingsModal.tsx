import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { updateSettings } from "../api/settings";
import { CURRENCY_OPTIONS } from "../utils/currency";
import { REMINDER_CHOICES, decodeReminderChoice, encodeReminderChoice, type ReminderChoice } from "../utils/interviewTiming";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme, type Theme } from "../context/ThemeContext";
import { CloseButton } from "./CloseButton";

const LANGUAGE_OPTIONS = ["en", "de", "tr"] as const;
const THEME_OPTIONS: Theme[] = ["system", "light", "dark"];

const inputStyle: React.CSSProperties = {
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	padding: "10px 12px",
	font: "13px var(--font-body)",
	background: "var(--color-input-bg)",
	color: "var(--color-text)",
	width: "100%",
};

const selectStyle: React.CSSProperties = {
	...inputStyle,
	appearance: "none",
	WebkitAppearance: "none",
	MozAppearance: "none",
	backgroundImage:
		"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23767468' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5l5 5 5-5'/%3E%3C/svg%3E\")",
	backgroundRepeat: "no-repeat",
	backgroundPosition: "right 12px center",
	backgroundSize: "14px",
	paddingRight: 34,
	cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 6,
	fontSize: 12.5,
	fontWeight: 500,
	color: "var(--color-label)",
};

export function SettingsModal({ onClose }: { onClose: () => void }) {
	const { t } = useTranslation();
	const { language, defaultCurrency, interviewReminderMode, interviewReminderHours, updateLocalSettings } = useAuth();
	const { theme, setTheme } = useTheme();
	const { showToast } = useToast();
	const [form, setForm] = useState({
		language,
		defaultCurrency,
		reminderChoice: encodeReminderChoice(interviewReminderMode, interviewReminderHours),
	});
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			const { mode, hours } = decodeReminderChoice(form.reminderChoice);
			const request = {
				language: form.language,
				defaultCurrency: form.defaultCurrency,
				interviewReminderMode: mode,
				interviewReminderHours: hours,
			};
			await updateSettings(request);
			updateLocalSettings(request);
			showToast(t("settingsModal.toasts.updated"), "success");
			onClose();
		} catch {
			showToast(t("settingsModal.toasts.error"), "error");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--color-overlay-backdrop)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				zIndex: 10,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--color-surface)",
					borderRadius: 16,
					padding: 32,
					width: "100%",
					maxWidth: 420,
					display: "flex",
					flexDirection: "column",
					gap: 16,
					position: "relative",
				}}
			>
				<CloseButton onClick={onClose} />
				<h2 style={{ font: "700 18px var(--font-heading)", margin: 0 }}>{t("settingsModal.title")}</h2>
				<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					<label style={labelStyle}>
						{t("settingsModal.language")}
						<select
							value={form.language}
							onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
							style={selectStyle}
						>
							{LANGUAGE_OPTIONS.map((code) => (
								<option key={code} value={code}>
									{t(`settingsModal.languageOptions.${code}`)}
								</option>
							))}
						</select>
					</label>
					<label style={labelStyle}>
						{t("settingsModal.theme")}
						<select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} style={selectStyle}>
							{THEME_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{t(`settingsModal.themeOptions.${option}`)}
								</option>
							))}
						</select>
					</label>
					<label style={labelStyle}>
						{t("settingsModal.defaultCurrency")}
						<select
							value={form.defaultCurrency}
							onChange={(e) => setForm((f) => ({ ...f, defaultCurrency: e.target.value }))}
							style={selectStyle}
						>
							{CURRENCY_OPTIONS.map((code) => (
								<option key={code} value={code}>
									{code}
								</option>
							))}
						</select>
					</label>
					<label style={labelStyle}>
						{t("settingsModal.interviewReminders")}
						<select
							value={form.reminderChoice}
							onChange={(e) => setForm((f) => ({ ...f, reminderChoice: e.target.value as ReminderChoice }))}
							style={selectStyle}
						>
							{REMINDER_CHOICES.map((choice) => (
								<option key={choice} value={choice}>
									{t(`settingsModal.reminderChoices.${choice}`)}
								</option>
							))}
						</select>
					</label>
					<div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
						<button
							type="submit"
							disabled={submitting}
							style={{
								border: "none",
								borderRadius: 10,
								padding: "10px 16px",
								background: "var(--color-accent)",
								color: "var(--color-on-accent)",
								font: "600 13px var(--font-body)",
								cursor: submitting ? "default" : "pointer",
								opacity: submitting ? 0.7 : 1,
							}}
						>
							{t("settingsModal.saveCta")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
