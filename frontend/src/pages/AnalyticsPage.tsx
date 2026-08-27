import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAnalytics } from "../api/analytics";
import type { Analytics } from "../types/analytics";
import { AppShell } from "../components/AppShell";
import { stageLabel, statusDotColor } from "../components/StatusBadge";
import { usePipelineStages } from "../context/PipelineStagesContext";

const cardStyle: React.CSSProperties = {
	background: "var(--color-surface)",
	border: "1px solid var(--color-border)",
	borderRadius: 14,
	padding: 16,
};

export function AnalyticsPage() {
	const { t, i18n } = useTranslation();
	const { stages } = usePipelineStages();
	const [analytics, setAnalytics] = useState<Analytics | null>(null);

	useEffect(() => {
		getAnalytics().then(setAnalytics);
	}, []);

	if (!analytics) {
		return (
			<AppShell>
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.loading")}</p>
			</AppShell>
		);
	}

	const maxFunnelCount = Math.max(1, ...analytics.funnelStages.map((f) => f.count));
	const maxMonthlyCount = Math.max(1, ...analytics.applicationsOverTime.map((m) => m.count));
	const maxTechCount = Math.max(1, ...analytics.topTechnologies.map((tc) => tc.count));
	const maxWorkModeCount = Math.max(1, ...analytics.applicationsByWorkMode.map((w) => w.count));
	const monthFormatter = new Intl.DateTimeFormat(i18n.language, { month: "short", timeZone: "UTC" });
	const formatMonth = (month: string) => monthFormatter.format(new Date(`${month}-01T00:00:00Z`));

	return (
		<AppShell>
			<div>
				<h1 style={{ font: "700 26px var(--font-heading)", margin: "0 0 4px" }}>{t("analytics.title")}</h1>
				<p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 14 }}>{t("analytics.subtitle")}</p>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
				<div style={cardStyle}>
					<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 12px" }}>{t("analytics.funnel")}</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{analytics.funnelStages.map((f) => (
							<div key={f.status}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
									<span style={{ fontWeight: 700, fontSize: 12.5 }}>{stageLabel(f.status, stages)}</span>
									<span style={{ fontSize: 12.5 }}>{f.count}</span>
								</div>
								<div style={{ height: 8, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
									<div
										style={{
											width: `${(f.count / maxFunnelCount) * 100}%`,
											height: "100%",
											borderRadius: 4,
											background: statusDotColor(f.status, stages),
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div style={cardStyle}>
					<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 12px" }}>{t("analytics.stageConversionRate")}</h3>
					<div style={{ display: "flex", flexDirection: "column" }}>
						{analytics.stageConversionRates.map((s, i) => (
							<div
								key={s.status}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "10px 0",
									borderBottom: i < analytics.stageConversionRates.length - 1 ? "1px solid var(--color-border)" : "none",
								}}
							>
								<span style={{ fontSize: 12.5 }}>{stageLabel(s.status, stages)}</span>
								<span style={{ fontWeight: 700, fontSize: 12.5 }}>{s.conversionRatePercent}%</span>
							</div>
						))}
					</div>
				</div>

				<div style={cardStyle}>
					<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 12px" }}>{t("analytics.topTechnologies")}</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						{analytics.topTechnologies.map((tc) => (
							<div key={tc.technology}>
								<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
									<span style={{ fontWeight: 700, fontSize: 12.5 }}>{tc.technology}</span>
									<span style={{ fontSize: 12.5 }}>{tc.count}</span>
								</div>
								<div style={{ height: 8, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
									<div style={{ width: `${(tc.count / maxTechCount) * 100}%`, height: "100%", borderRadius: 4, background: "var(--color-accent)" }} />
								</div>
							</div>
						))}
						{analytics.topTechnologies.length === 0 && (
							<p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: 12.5 }}>{t("analytics.noTechnologies")}</p>
						)}
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 16, alignSelf: "start" }}>
					<div style={cardStyle}>
						<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 12px" }}>{t("analytics.applicationsOverTime")}</h3>
						<div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
							{analytics.applicationsOverTime.map((m) => (
								<div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
									<div style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>{m.count}</div>
									<div
										style={{
											width: "100%",
											maxWidth: 24,
											height: `${(m.count / maxMonthlyCount) * 100}%`,
											minHeight: m.count > 0 ? 4 : 0,
											borderRadius: "3px 3px 0 0",
											background: "var(--color-timeseries)",
										}}
									/>
									<div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{formatMonth(m.month)}</div>
								</div>
							))}
						</div>
					</div>

					<div style={cardStyle}>
						<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 12px" }}>{t("analytics.applicationsByWorkMode")}</h3>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							{analytics.applicationsByWorkMode.map((w) => (
								<div key={w.workMode}>
									<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
										<span style={{ fontWeight: 700, fontSize: 12.5 }}>{t(`applicationForm.workModeOptions.${w.workMode}`)}</span>
										<span style={{ fontSize: 12.5 }}>{w.count}</span>
									</div>
									<div style={{ height: 8, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
										<div style={{ width: `${(w.count / maxWorkModeCount) * 100}%`, height: "100%", borderRadius: 4, background: "var(--color-timeseries)" }} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
