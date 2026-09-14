import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getDashboardStatistics } from "../api/dashboard";
import { createApplication } from "../api/applications";
import { updateSettings } from "../api/settings";
import type { InterviewReminderMode } from "../api/auth";
import type { DashboardStatistics } from "../types/dashboard";
import type { UpcomingInterview } from "../types/dashboard";
import type { CreateApplicationRequest } from "../types/application";
import { AppShell } from "../components/AppShell";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { CloseButton } from "../components/CloseButton";
import { stageLabel, statusDotColor } from "../components/StatusBadge";
import { XIcon } from "../components/IconButton";
import { formatDateTime, formatTime } from "../utils/date";
import {
	isMeetingJoinable,
	isWithinReminderMode,
	REMINDER_CHOICES,
	decodeReminderChoice,
	type ReminderChoice,
} from "../utils/interviewTiming";
import { useToast } from "../context/ToastContext";
import { usePipelineStages } from "../context/PipelineStagesContext";
import { useAuth } from "../context/AuthContext";

const cardStyle: React.CSSProperties = {
	background: "var(--color-surface)",
	border: "1px solid var(--color-border)",
	borderRadius: 14,
	padding: 22,
};

const BANNER_SNOOZED_UNTIL_KEY = "nextrole_reminder_banner_snoozed_until";

function interviewKey(iv: UpcomingInterview): string {
	return `${iv.applicationId}-${iv.scheduledAt}`;
}

function endOfLocalDay(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}

function loadBannerSnoozedUntil(): number {
	return Number(localStorage.getItem(BANNER_SNOOZED_UNTIL_KEY) ?? "0");
}

type SnoozeChoice = "10min" | "1h" | "today" | "never" | "always";

function SnoozeMenu({ onChoose, onClose }: { onChoose: (choice: SnoozeChoice) => void; onClose: () => void }) {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleOutsideClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
		}
		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, [onClose]);

	const choices: SnoozeChoice[] = ["10min", "1h", "today", "never", "always"];

	return (
		<div
			ref={containerRef}
			role="menu"
			style={{
				position: "absolute",
				top: "calc(100% + 4px)",
				right: 0,
				background: "var(--color-surface)",
				border: "1px solid var(--color-border)",
				borderRadius: 10,
				boxShadow: "0 12px 32px var(--color-shadow-md)",
				padding: 4,
				zIndex: 6,
				minWidth: 180,
			}}
		>
			{choices.map((choice) => (
				<div
					key={choice}
					role="menuitem"
					onClick={() => onChoose(choice)}
					style={{
						padding: "8px 10px",
						borderRadius: 6,
						cursor: "pointer",
						fontSize: 12.5,
						color: "var(--color-text)",
						whiteSpace: "nowrap",
					}}
				>
					{t(`dashboard.reminderBanner.snoozeChoices.${choice}`)}
				</div>
			))}
		</div>
	);
}

function ReminderFirstTimePrompt({
	onChoose,
	onSkip,
}: {
	onChoose: (choice: ReminderChoice) => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation();
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
				<CloseButton onClick={onSkip} />
				<h2 style={{ font: "700 18px var(--font-heading)", margin: 0 }}>{t("dashboard.reminderPrompt.title")}</h2>
				<p style={{ margin: 0, fontSize: 13.5, color: "var(--color-text-muted)" }}>{t("dashboard.reminderPrompt.description")}</p>
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					{REMINDER_CHOICES.map((choice) => (
						<button
							key={choice}
							type="button"
							onClick={() => onChoose(choice)}
							style={{
								border: "1px solid var(--color-border)",
								borderRadius: 10,
								padding: "10px 14px",
								background: choice === "ALWAYS" ? "var(--color-highlight-bg)" : "var(--color-surface)",
								color: "var(--color-text)",
								font: "600 13px var(--font-body)",
								textAlign: "left",
								cursor: "pointer",
							}}
						>
							{t(`settingsModal.reminderChoices.${choice}`)}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export function DashboardPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { stages } = usePipelineStages();
	const {
		interviewReminderMode,
		interviewReminderHours,
		interviewReminderPrompted,
		updateLocalSettings,
	} = useAuth();
	const [stats, setStats] = useState<DashboardStatistics | null>(null);
	const [creating, setCreating] = useState(false);
	const [bannerSnoozedUntil, setBannerSnoozedUntil] = useState<number>(loadBannerSnoozedUntil);
	const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);
	const [firstTimePromptOpen, setFirstTimePromptOpen] = useState(false);

	async function refresh() {
		const data = await getDashboardStatistics();
		setStats(data);
	}

	function snoozeBanner(until: number) {
		localStorage.setItem(BANNER_SNOOZED_UNTIL_KEY, String(until));
		setBannerSnoozedUntil(until);
	}

	async function applyReminderMode(mode: InterviewReminderMode, hours = interviewReminderHours) {
		try {
			await updateSettings({ interviewReminderMode: mode, interviewReminderHours: hours });
			updateLocalSettings({ interviewReminderMode: mode, interviewReminderHours: hours });
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	async function markReminderPrompted() {
		try {
			await updateSettings({ interviewReminderPrompted: true });
			updateLocalSettings({ interviewReminderPrompted: true });
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	async function handleSnoozeChoice(choice: SnoozeChoice) {
		setSnoozeMenuOpen(false);
		switch (choice) {
			case "10min":
				snoozeBanner(Date.now() + 10 * 60 * 1000);
				break;
			case "1h":
				snoozeBanner(Date.now() + 60 * 60 * 1000);
				break;
			case "today":
				snoozeBanner(endOfLocalDay(new Date()));
				break;
			case "never":
				await applyReminderMode("OFF");
				break;
			case "always":
				await applyReminderMode("ALWAYS");
				break;
		}
	}

	function countdownLabel(scheduledAt: string): string {
		const diffMs = new Date(scheduledAt).getTime() - Date.now();
		if (diffMs <= 0) return t("dashboard.reminderBanner.now");
		const diffMinutes = Math.round(diffMs / 60000);
		if (diffMinutes < 60) return t("dashboard.reminderBanner.inMinutes", { count: diffMinutes });
		return t("dashboard.reminderBanner.inHours", { count: Math.round(diffMinutes / 60) });
	}

	useEffect(() => {
		refresh();
	}, []);

	async function handleCreate(request: CreateApplicationRequest) {
		try {
			await createApplication(request);
			showToast(t("applications.toasts.created"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	if (!stats) {
		return (
			<AppShell>
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.loading")}</p>
			</AppShell>
		);
	}

	// The primary reminder and the accent dot always track today's actual earliest qualifying
	// interview, independent of whether the banner itself is currently snoozed — snoozing hides
	// the banner UI for a while, it doesn't change which interview is "next up".
	const qualifyingReminders = stats.upcomingInterviews.filter((iv) =>
		isWithinReminderMode(iv.scheduledAt, iv.durationMinutes, interviewReminderMode, interviewReminderHours)
	);
	const primaryReminder = qualifyingReminders[0];
	const moreRemindersCount = Math.max(qualifyingReminders.length - 1, 0);
	const bannerVisible = primaryReminder !== undefined && bannerSnoozedUntil <= Date.now();

	// Surfaces the first overlapping pair as an always-visible heads-up, independent of the
	// (snoozable) reminder banner above. Conflicts are resolved server-side against every upcoming
	// interview, so a clash with one too far out to be listed here is still reported.
	const conflictingInterview = stats.upcomingInterviews.find((iv) => iv.conflictsWith);
	const conflictingWith = conflictingInterview?.conflictsWith ?? undefined;

	const subColorPositive = "var(--color-positive)";
	const subColorNeutral = "var(--color-text-muted)";

	const statTiles = [
		{
			label: t("dashboard.stats.activeApplications"),
			value: stats.activeApplications,
			sub: t("dashboard.addedThisMonth", { count: stats.applicationsAddedThisMonth }),
			subColor: subColorPositive,
		},
		{
			label: t("dashboard.stats.interviewsThisWeek"),
			value: stats.interviewsThisWeek,
			sub: null,
			subColor: subColorNeutral,
		},
		{
			label: t("dashboard.stats.responseRate"),
			value: `${stats.responseRatePercent}%`,
			sub: null,
			subColor: subColorNeutral,
		},
		{
			label: t("dashboard.stats.avgDaysInPipeline"),
			value: stats.avgDaysInPipeline,
			sub: t("dashboard.acrossPipeline"),
			subColor: subColorNeutral,
		},
	];

	const totalFunnelCount = stats.funnelStages.reduce((sum, f) => sum + f.count, 0);

	return (
		<AppShell>
			<div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
				<div>
					<h1 style={{ font: "700 26px var(--font-heading)", margin: "0 0 4px" }}>{t("dashboard.title")}</h1>
					<p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 14 }}>
						{t("dashboard.subtitle", { count: stats.activeApplications })}
					</p>
				</div>
				<button
					onClick={() => setCreating(true)}
					style={{
						border: "none",
						borderRadius: 10,
						padding: "11px 18px",
						background: "var(--color-accent)",
						color: "var(--color-on-accent)",
						font: "600 13px var(--font-body)",
						cursor: "pointer",
					}}
				>
					{t("applications.newApplication")}
				</button>
			</div>

			{bannerVisible && primaryReminder && (
				<div
					style={{
						background: "var(--color-highlight-bg)",
						borderRadius: 12,
						padding: "12px 18px",
						display: "flex",
						alignItems: "center",
						gap: 14,
						flexWrap: "wrap",
					}}
				>
					<span
						style={{
							font: "600 12.5px var(--font-mono)",
							color: "var(--color-highlight-text-strong)",
							letterSpacing: "0.04em",
							flex: "none",
						}}
					>
						{t("dashboard.reminderBanner.label")} · {countdownLabel(primaryReminder.scheduledAt)}
					</span>
					<span style={{ fontWeight: 700, fontSize: 15.5, color: "var(--color-highlight-text-strong)" }}>{primaryReminder.company}</span>
					<span style={{ fontSize: 14.5, color: "var(--color-highlight-text)" }}>
						{[primaryReminder.round, formatTime(primaryReminder.scheduledAt), primaryReminder.mode].filter(Boolean).join(" · ")}
					</span>
					{moreRemindersCount > 0 && (
						<span style={{ fontSize: 13.5, color: "var(--color-highlight-text)" }}>
							{t("dashboard.reminderBanner.moreToday", { count: moreRemindersCount })}
						</span>
					)}
					<div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
						<button
							type="button"
							onClick={() => navigate(`/applications/${primaryReminder.applicationId}`, { state: { tab: "notes" } })}
							style={{
								border: "none",
								borderRadius: 8,
								padding: "7px 14px",
								background: "var(--color-surface)",
								color: "var(--color-highlight-text-strong)",
								font: "600 14px var(--font-body)",
								cursor: "pointer",
							}}
						>
							{t("dashboard.reminderBanner.openNotes")}
						</button>
						{primaryReminder.meetingLink && (
							<a
								href={primaryReminder.meetingLink}
								target="_blank"
								rel="noreferrer"
								style={{
									borderRadius: 8,
									padding: "7px 14px",
									background: "var(--color-accent)",
									color: "var(--color-on-accent)",
									font: "600 14px var(--font-body)",
									textDecoration: "none",
								}}
							>
								{isMeetingJoinable(primaryReminder.scheduledAt, primaryReminder.durationMinutes)
									? t("applicationDetail.interviewForm.joinCta")
									: t("applicationDetail.interviewForm.goToLinkCta")}
							</a>
						)}
						<div style={{ position: "relative" }}>
							<button
								type="button"
								onClick={() => {
									if (!interviewReminderPrompted) {
										setFirstTimePromptOpen(true);
									} else {
										setSnoozeMenuOpen((v) => !v);
									}
								}}
								aria-label={t("dashboard.reminderBanner.dismiss")}
								title={t("dashboard.reminderBanner.dismiss")}
								style={{
									border: "none",
									background: "transparent",
									color: "var(--color-highlight-text-strong)",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 24,
									height: 24,
								}}
							>
								<XIcon />
							</button>
							{snoozeMenuOpen && (
								<SnoozeMenu
									onClose={() => setSnoozeMenuOpen(false)}
									onChoose={handleSnoozeChoice}
								/>
							)}
						</div>
					</div>
				</div>
			)}

			{conflictingInterview && conflictingWith && (
				<div
					style={{
						background: "var(--color-warning-bg)",
						color: "var(--color-warning-text)",
						borderRadius: 12,
						padding: "12px 18px",
						fontSize: 13.5,
						fontWeight: 500,
					}}
				>
					{t("dashboard.conflictBanner.message", {
						companyA: conflictingInterview.company,
						timeA: formatDateTime(conflictingInterview.scheduledAt),
						companyB: conflictingWith.company,
						timeB: formatDateTime(conflictingWith.scheduledAt),
					})}
				</div>
			)}

			{firstTimePromptOpen && (
				<ReminderFirstTimePrompt
					onChoose={async (choice) => {
						const { mode, hours } = decodeReminderChoice(choice);
						setFirstTimePromptOpen(false);
						await applyReminderMode(mode, hours);
						await markReminderPrompted();
					}}
					onSkip={async () => {
						setFirstTimePromptOpen(false);
						await markReminderPrompted();
					}}
				/>
			)}

			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
				{statTiles.map((tile) => (
					<div key={tile.label} style={cardStyle}>
						<div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>{tile.label}</div>
						<div style={{ font: "700 28px var(--font-heading)", marginTop: 6 }}>{tile.value}</div>
						{tile.sub && <div style={{ fontSize: 12, color: tile.subColor, marginTop: 4 }}>{tile.sub}</div>}
					</div>
				))}
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "stretch" }}>
				<div style={{ ...cardStyle, display: "flex", flexDirection: "column", height: 340 }}>
					<h3 style={{ font: "700 15px var(--font-heading)", margin: "0 0 16px" }}>{t("dashboard.upcomingInterviews")}</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", flex: 1 }}>
						{stats.upcomingInterviews.map((iv) => (
							<div
								key={`${iv.applicationId}-${iv.scheduledAt}`}
								onClick={() => navigate(`/applications/${iv.applicationId}`)}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 14,
									padding: "12px 4px",
									borderBottom: "1px solid var(--color-border)",
									cursor: "pointer",
								}}
							>
								{primaryReminder && interviewKey(iv) === interviewKey(primaryReminder) && (
									<div
										style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", flex: "none" }}
										title={t("dashboard.reminderBanner.label")}
									/>
								)}
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ fontWeight: 600, fontSize: 13.5 }}>{iv.company}</div>
									<div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
										{[iv.round, iv.durationMinutes ? t("applicationDetail.interviewForm.durationLabel", { count: iv.durationMinutes }) : null]
											.filter(Boolean)
											.join(" · ")}
									</div>
								</div>
								<div style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{formatDateTime(iv.scheduledAt)}</div>
							</div>
						))}
						{stats.upcomingInterviews.length === 0 && (
							<p style={{ color: "var(--color-text-muted)", margin: 0 }}>{t("dashboard.noUpcomingInterviews")}</p>
						)}
					</div>
				</div>

				<div style={{ ...cardStyle, display: "flex", flexDirection: "column", height: 340 }}>
					<h3 style={{ font: "700 15px var(--font-heading)", margin: "0 0 16px" }}>{t("dashboard.recentActivity")}</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
						{stats.recentActivity.map((activity) => (
							<div key={`${activity.applicationId}-${activity.changedAt}`} style={{ display: "flex", gap: 12 }}>
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										background: "var(--color-accent)",
										marginTop: 6,
										flex: "none",
									}}
								/>
								<div style={{ fontSize: 13, lineHeight: 1.5 }}>
									{t("dashboard.movedTo", { company: activity.company, status: stageLabel(activity.status, stages) })}
									<div style={{ color: "var(--color-text-faint)", fontSize: 11.5 }}>{formatDateTime(activity.changedAt)}</div>
								</div>
							</div>
						))}
						{stats.recentActivity.length === 0 && (
							<p style={{ color: "var(--color-text-muted)", margin: 0 }}>{t("dashboard.noRecentActivity")}</p>
						)}
					</div>
				</div>
			</div>

			<div style={cardStyle}>
				<h3 style={{ font: "700 15px var(--font-heading)", margin: "0 0 16px" }}>{t("dashboard.pipelineOverview")}</h3>
				<div style={{ display: "flex", gap: 3, borderRadius: 8, overflow: "hidden", height: 12 }}>
					{stats.funnelStages.map((f) => (
						<div
							key={f.status}
							style={{
								flex: `${Math.max(f.count, 0.001)} 0 0`,
								background: statusDotColor(f.status, stages),
							}}
							title={stageLabel(f.status, stages)}
						/>
					))}
				</div>
				<div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
					{stats.funnelStages.map((f) => (
						<div key={f.status} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
							<div style={{ width: 8, height: 8, borderRadius: 2, background: statusDotColor(f.status, stages) }} />
							{stageLabel(f.status, stages)} ({f.count})
						</div>
					))}
				</div>
				<div style={{ fontSize: 11.5, color: "var(--color-text-faint)", marginTop: 10 }}>{totalFunnelCount} total</div>
			</div>

			{creating && <ApplicationFormModal onSubmit={handleCreate} onClose={() => setCreating(false)} />}
		</AppShell>
	);
}
