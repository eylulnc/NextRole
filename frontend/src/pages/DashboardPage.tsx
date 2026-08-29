import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getDashboardStatistics } from "../api/dashboard";
import { createApplication } from "../api/applications";
import type { DashboardStatistics } from "../types/dashboard";
import type { CreateApplicationRequest } from "../types/application";
import { AppShell } from "../components/AppShell";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { stageLabel, statusDotColor } from "../components/StatusBadge";
import { formatDateTime } from "../utils/date";
import { useToast } from "../context/ToastContext";
import { usePipelineStages } from "../context/PipelineStagesContext";

const cardStyle: React.CSSProperties = {
	background: "var(--color-surface)",
	border: "1px solid var(--color-border)",
	borderRadius: 14,
	padding: 22,
};

export function DashboardPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { stages } = usePipelineStages();
	const [stats, setStats] = useState<DashboardStatistics | null>(null);
	const [creating, setCreating] = useState(false);

	async function refresh() {
		const data = await getDashboardStatistics();
		setStats(data);
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
