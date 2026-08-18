import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCalendarInterviews } from "../api/calendar";
import type { UpcomingInterview } from "../types/dashboard";
import { AppShell } from "../components/AppShell";
import { formatDateTime } from "../utils/date";

const cardStyle: React.CSSProperties = {
	background: "#fff",
	border: "1px solid var(--color-border)",
	borderRadius: 14,
	padding: 22,
};

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function dateKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [interviews, setInterviews] = useState<UpcomingInterview[]>([]);
	const [viewDate, setViewDate] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

	useEffect(() => {
		getCalendarInterviews().then(setInterviews);
	}, []);

	const interviewsByDay = useMemo(() => {
		const map = new Map<string, UpcomingInterview[]>();
		for (const iv of interviews) {
			const key = dateKey(new Date(iv.scheduledAt));
			const list = map.get(key) ?? [];
			list.push(iv);
			map.set(key, list);
		}
		return map;
	}, [interviews]);

	const upcomingInterviews = useMemo(() => {
		const now = Date.now();
		return interviews
			.filter((iv) => new Date(iv.scheduledAt).getTime() >= now)
			.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
			.slice(0, 8);
	}, [interviews]);

	const selectedDayInterviews = useMemo(() => {
		if (!selectedDateKey) return [];
		return (interviewsByDay.get(selectedDateKey) ?? [])
			.slice()
			.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
	}, [interviewsByDay, selectedDateKey]);

	const today = new Date();
	const year = viewDate.getFullYear();
	const month = viewDate.getMonth();
	const firstOfMonth = new Date(year, month, 1);
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const leadingBlanks = firstOfMonth.getDay();

	const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

	function changeMonth(delta: number) {
		setViewDate(new Date(year, month + delta, 1));
	}

	const cells: { num: number | null; key: string | null; isToday: boolean; hasEvent: boolean }[] = [];
	for (let i = 0; i < leadingBlanks; i++) {
		cells.push({ num: null, key: null, isToday: false, hasEvent: false });
	}
	for (let day = 1; day <= daysInMonth; day++) {
		const d = new Date(year, month, day);
		const key = dateKey(d);
		cells.push({
			num: day,
			key,
			isToday: dateKey(today) === key,
			hasEvent: interviewsByDay.has(key),
		});
	}

	return (
		<AppShell>
			<h1 style={{ font: "700 26px var(--font-heading)", margin: 0 }}>{t("calendar.title")}</h1>

			<div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "start" }}>
				<div style={cardStyle}>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
						<h3 style={{ font: "700 15px var(--font-heading)", margin: 0 }}>{monthLabel}</h3>
						<div style={{ display: "flex", gap: 6 }}>
							<button onClick={() => changeMonth(-1)} style={navButtonStyle} aria-label={t("calendar.previousMonth")}>
								‹
							</button>
							<button onClick={() => changeMonth(1)} style={navButtonStyle} aria-label={t("calendar.nextMonth")}>
								›
							</button>
						</div>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(7, 1fr)",
							gap: 6,
							fontSize: 11,
							fontWeight: 600,
							color: "var(--color-text-faint)",
							textTransform: "uppercase",
							marginBottom: 8,
						}}
					>
						{WEEKDAY_KEYS.map((key) => (
							<div key={key}>{t(`calendar.weekdays.${key}`)}</div>
						))}
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
						{cells.map((cell, i) => {
							const isSelected = cell.key !== null && cell.key === selectedDateKey;
							return (
								<div
									key={cell.key ?? `blank-${i}`}
									data-testid={cell.key ? `calendar-day-${cell.key}` : undefined}
									onClick={() => {
										if (!cell.key) return;
										setSelectedDateKey((prev) => (prev === cell.key ? null : cell.key));
									}}
									style={{
										aspectRatio: "1",
										borderRadius: 10,
										border: isSelected ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
										background: cell.isToday ? "oklch(93% 0.03 35)" : "#fff",
										padding: 6,
										display: "flex",
										flexDirection: "column",
										gap: 4,
										visibility: cell.num === null ? "hidden" : "visible",
										cursor: cell.num === null ? "default" : "pointer",
									}}
								>
									<span
										style={{
											fontSize: 12,
											fontWeight: 600,
											color: cell.isToday ? "oklch(42% 0.11 35)" : "var(--color-text)",
										}}
									>
										{cell.num}
									</span>
									{cell.hasEvent && (
										<div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)" }} />
									)}
								</div>
							);
						})}
					</div>
				</div>

				<div style={cardStyle}>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
						<h3 style={{ font: "700 15px var(--font-heading)", margin: 0 }}>
							{selectedDateKey
								? new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric",
									})
								: t("dashboard.upcomingInterviews")}
						</h3>
						{selectedDateKey && (
							<a
								href="#"
								onClick={(e) => {
									e.preventDefault();
									setSelectedDateKey(null);
								}}
								style={{ fontSize: 12, textDecoration: "none", fontWeight: 600 }}
							>
								{t("calendar.viewUpcoming")}
							</a>
						)}
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
						{(selectedDateKey ? selectedDayInterviews : upcomingInterviews).map((iv) => (
							<div
								key={`${iv.applicationId}-${iv.scheduledAt}`}
								onClick={() => navigate(`/applications/${iv.applicationId}`)}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 14,
									padding: "12px 4px",
									borderBottom: "1px solid oklch(94% 0.005 250)",
									cursor: "pointer",
								}}
							>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ fontWeight: 600, fontSize: 13.5 }}>{iv.company}</div>
									<div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>{iv.round}</div>
								</div>
								<div style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{formatDateTime(iv.scheduledAt)}</div>
							</div>
						))}
						{selectedDateKey
							? selectedDayInterviews.length === 0 && (
									<p style={{ color: "var(--color-text-muted)", margin: 0 }}>{t("calendar.noInterviewsOnDay")}</p>
								)
							: upcomingInterviews.length === 0 && (
									<p style={{ color: "var(--color-text-muted)", margin: 0 }}>{t("dashboard.noUpcomingInterviews")}</p>
								)}
					</div>
				</div>
			</div>
		</AppShell>
	);
}

const navButtonStyle: React.CSSProperties = {
	width: 28,
	height: 28,
	borderRadius: 8,
	border: "1px solid var(--color-border)",
	background: "#fff",
	color: "var(--color-text-muted)",
	cursor: "pointer",
	fontSize: 14,
};
