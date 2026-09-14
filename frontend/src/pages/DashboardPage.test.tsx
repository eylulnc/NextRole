import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { PipelineStagesProvider } from "../context/PipelineStagesContext";
import { SAMPLE_STAGES } from "../test/pipelineStagesFixture";
import * as dashboardApi from "../api/dashboard";
import * as pipelineStagesApi from "../api/pipelineStages";
import * as settingsApi from "../api/settings";
import type { DashboardStatistics } from "../types/dashboard";

vi.mock("../api/dashboard");
vi.mock("../api/pipelineStages");
vi.mock("../api/settings");

const SAMPLE_STATS: DashboardStatistics = {
	activeApplications: 4,
	applicationsAddedThisMonth: 2,
	interviewsThisWeek: 1,
	responseRatePercent: 50,
	avgDaysInPipeline: 9,
	funnelStages: [
		{ status: "SAVED", count: 1 },
		{ status: "APPLIED", count: 2 },
		{ status: "HR_INTERVIEW", count: 0 },
		{ status: "TECHNICAL", count: 1 },
		{ status: "FINAL", count: 0 },
		{ status: "OFFER", count: 0 },
		{ status: "REJECTED", count: 0 },
	],
	upcomingInterviews: [
		{
			id: "iv-1",
			applicationId: "app-1",
			company: "Acme Corp",
			role: "Backend Engineer",
			round: "HR Screen",
			scheduledAt: "2026-08-20T10:00:00Z",
			mode: null,
			durationMinutes: null,
			meetingLink: null,
			conflictsWith: null,
		},
	],
	recentActivity: [{ applicationId: "app-1", company: "Acme Corp", status: "APPLIED", changedAt: "2026-08-18T00:00:00Z" }],
};

function renderDashboard() {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	localStorage.setItem("nextrole_interview_reminder_prompted", "true");
	return render(
		<MemoryRouter initialEntries={["/dashboard"]}>
			<AuthProvider>
				<PipelineStagesProvider>
					<ToastProvider>
						<Routes>
							<Route path="/dashboard" element={<DashboardPage />} />
							<Route path="/applications/:id" element={<div>Application detail</div>} />
						</Routes>
					</ToastProvider>
				</PipelineStagesProvider>
			</AuthProvider>
		</MemoryRouter>
	);
}

describe("DashboardPage", () => {
	beforeEach(() => {
		// Pin the clock well away from local midnight so offsets like "+6h" or "+26h" can't
		// flip which calendar day they land on depending on when the suite happens to run.
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date(2026, 7, 15, 8, 0, 0));
		localStorage.clear();
		vi.clearAllMocks();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(SAMPLE_STATS);
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue(SAMPLE_STAGES);
		vi.mocked(settingsApi.updateSettings).mockResolvedValue({
			language: "en",
			defaultCurrency: "EUR",
			interviewReminderMode: "ALWAYS",
			interviewReminderHours: 24,
			interviewReminderPrompted: true,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders stat tiles and lists from the statistics response", async () => {
		renderDashboard();

		expect(await screen.findByText("4")).toBeInTheDocument();
		expect(screen.getByText("50%")).toBeInTheDocument();
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("HR Screen")).toBeInTheDocument();
	});

	it("navigates to the application detail page when clicking an upcoming interview", async () => {
		renderDashboard();

		await userEvent.click(await screen.findByText("Acme Corp"));

		expect(await screen.findByText("Application detail")).toBeInTheDocument();
	});

	it("shows a reminder banner with Open notes and a meeting link action", async () => {
		const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon, meetingLink: "https://meet.example.com/room" }],
		});
		renderDashboard();

		expect(await screen.findByText("Next up", { exact: false })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Open notes" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Go to link" })).toBeInTheDocument();
	});

	it("shows the reminder banner for an interview later today, not just imminent ones", async () => {
		const laterToday = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: laterToday }],
		});
		renderDashboard();

		expect(await screen.findByText("Next up", { exact: false })).toBeInTheDocument();
	});

	it("does not show a reminder banner for an interview that isn't today", async () => {
		const tomorrow = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: tomorrow }],
		});
		renderDashboard();

		await screen.findByText("Acme Corp");
		expect(screen.queryByText("Next up", { exact: false })).not.toBeInTheDocument();
	});

	it("snoozes the reminder banner for the rest of the day and persists it", async () => {
		const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon }],
		});
		renderDashboard();

		await screen.findByText("Next up", { exact: false });
		await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
		await userEvent.click(screen.getByRole("menuitem", { name: "Don't show today" }));

		expect(screen.queryByText("Next up", { exact: false })).not.toBeInTheDocument();
		expect(Number(localStorage.getItem("nextrole_reminder_banner_snoozed_until"))).toBeGreaterThan(Date.now());
	});

	it("hides the banner entirely on snooze instead of jumping to a later interview today", async () => {
		const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
		const muchLater = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [
				{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon },
				{ ...SAMPLE_STATS.upcomingInterviews[0], applicationId: "app-2", company: "Globex", scheduledAt: muchLater },
			],
		});
		renderDashboard();

		await screen.findByText("Acme Corp", { selector: "span" });
		await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
		await userEvent.click(screen.getByRole("menuitem", { name: "Remind me in 10 min" }));

		expect(screen.queryByText("Next up", { exact: false })).not.toBeInTheDocument();
		expect(screen.queryByText("Globex", { selector: "span" })).not.toBeInTheDocument();
	});

	it("keeps the accent indicator on today's earliest interview even while the banner is snoozed", async () => {
		const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
		const muchLater = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [
				{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon },
				{ ...SAMPLE_STATS.upcomingInterviews[0], applicationId: "app-2", company: "Globex", scheduledAt: muchLater },
			],
		});
		renderDashboard();

		await screen.findByText("Acme Corp", { selector: "span" });
		expect(screen.getAllByTitle("Next up")).toHaveLength(1);

		await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
		await userEvent.click(screen.getByRole("menuitem", { name: "Remind me in 10 min" }));

		expect(screen.queryByText("Next up", { exact: false })).not.toBeInTheDocument();
		expect(screen.getAllByTitle("Next up")).toHaveLength(1);
	});

	it("shows a '+N more today' count when multiple interviews qualify", async () => {
		const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString();
		const alsoSoon = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [
				{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon },
				{ ...SAMPLE_STATS.upcomingInterviews[0], applicationId: "app-2", company: "Globex", scheduledAt: alsoSoon },
			],
		});
		renderDashboard();

		expect(await screen.findByText("+1 more today")).toBeInTheDocument();
	});

	it("does not show a reminder banner when disabled in settings", async () => {
		localStorage.setItem("nextrole_interview_reminder_mode", "OFF");
		const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon }],
		});
		renderDashboard();

		await screen.findByText("Acme Corp");
		expect(screen.queryByText("Next up", { exact: false })).not.toBeInTheDocument();
	});

	it("shows a conflict banner from the server-reported conflict", async () => {
		const start = new Date(Date.now() + 90 * 60 * 1000);
		const clash = new Date(start.getTime() + 15 * 60 * 1000);
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [
				{
					...SAMPLE_STATS.upcomingInterviews[0],
					id: "iv-1",
					company: "Acme Corp",
					scheduledAt: start.toISOString(),
					durationMinutes: 60,
					conflictsWith: {
						id: "iv-2",
						applicationId: "app-2",
						company: "Globex",
						scheduledAt: clash.toISOString(),
						durationMinutes: 60,
					},
				},
			],
		});
		renderDashboard();

		expect(await screen.findByText("conflicting interviews", { exact: false })).toBeInTheDocument();
		expect(screen.getAllByText("Acme Corp", { exact: false }).length).toBeGreaterThan(0);
		expect(screen.getAllByText("Globex", { exact: false }).length).toBeGreaterThan(0);
	});

	it("reports a conflict with an interview too far out to be listed", async () => {
		const start = new Date(Date.now() + 90 * 60 * 1000);
		// The clashing interview is not among upcomingInterviews at all — the server saw it past
		// the dashboard's limit. The banner must still name it.
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [
				{
					...SAMPLE_STATS.upcomingInterviews[0],
					id: "iv-1",
					company: "Acme Corp",
					scheduledAt: start.toISOString(),
					durationMinutes: 60,
					conflictsWith: {
						id: "iv-beyond-limit",
						applicationId: "app-9",
						company: "Initech",
						scheduledAt: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
						durationMinutes: 60,
					},
				},
			],
		});
		renderDashboard();

		expect(await screen.findByText("conflicting interviews", { exact: false })).toBeInTheDocument();
		expect(screen.getAllByText("Initech", { exact: false }).length).toBeGreaterThan(0);
	});

	it("does not show a conflict banner when the server reports no conflict", async () => {
		const start = new Date(Date.now() + 90 * 60 * 1000);
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [
				{ ...SAMPLE_STATS.upcomingInterviews[0], id: "iv-1", company: "Acme Corp", scheduledAt: start.toISOString(), durationMinutes: 30 },
				{
					...SAMPLE_STATS.upcomingInterviews[0],
					id: "iv-2",
					applicationId: "app-2",
					company: "Globex",
					scheduledAt: new Date(start.getTime() + 5 * 60 * 60 * 1000).toISOString(),
					durationMinutes: 30,
				},
			],
		});
		renderDashboard();

		await screen.findAllByText("Acme Corp", { exact: false });
		expect(screen.queryByText("conflicting interviews", { exact: false })).not.toBeInTheDocument();
	});

	it("shows empty states when there is no interview or activity data", async () => {
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [],
			recentActivity: [],
		});
		renderDashboard();

		expect(await screen.findByText("No interviews scheduled.")).toBeInTheDocument();
		expect(screen.getByText("No recent activity yet.")).toBeInTheDocument();
	});

	it("shows the first-time reminder prompt when clicking Dismiss before the user has been asked", async () => {
		localStorage.setItem("nextrole_email", "user@example.com");
		localStorage.setItem("nextrole_token", "fake-token");
		const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon }],
		});
		render(
			<MemoryRouter initialEntries={["/dashboard"]}>
				<AuthProvider>
					<PipelineStagesProvider>
						<ToastProvider>
							<Routes>
								<Route path="/dashboard" element={<DashboardPage />} />
							</Routes>
						</ToastProvider>
					</PipelineStagesProvider>
				</AuthProvider>
			</MemoryRouter>
		);

		await screen.findByText("Next up", { exact: false });
		expect(screen.queryByText("Interview reminders")).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

		expect(await screen.findByText("Interview reminders")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "3 hours before" }));

		await waitFor(() => {
			expect(screen.queryByText("Interview reminders")).not.toBeInTheDocument();
		});
		expect(settingsApi.updateSettings).toHaveBeenCalledWith({ interviewReminderMode: "HOURS", interviewReminderHours: 3 });
		expect(settingsApi.updateSettings).toHaveBeenCalledWith({ interviewReminderPrompted: true });
	});

	it("turns reminders off entirely from the snooze menu's Never option", async () => {
		const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue({
			...SAMPLE_STATS,
			upcomingInterviews: [{ ...SAMPLE_STATS.upcomingInterviews[0], scheduledAt: soon }],
		});
		renderDashboard();

		await screen.findByText("Next up", { exact: false });
		await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
		await userEvent.click(screen.getByRole("menuitem", { name: "Never" }));

		await waitFor(() => {
			expect(settingsApi.updateSettings).toHaveBeenCalledWith({ interviewReminderMode: "OFF", interviewReminderHours: 24 });
		});
	});
});
