import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import * as dashboardApi from "../api/dashboard";
import type { DashboardStatistics } from "../types/dashboard";

vi.mock("../api/dashboard");

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
		{ applicationId: "app-1", company: "Acme Corp", role: "Backend Engineer", round: "HR Screen", scheduledAt: "2026-08-20T10:00:00Z" },
	],
	recentActivity: [{ applicationId: "app-1", company: "Acme Corp", status: "APPLIED", changedAt: "2026-08-18T00:00:00Z" }],
};

function renderDashboard() {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	return render(
		<MemoryRouter initialEntries={["/dashboard"]}>
			<AuthProvider>
				<ToastProvider>
					<Routes>
						<Route path="/dashboard" element={<DashboardPage />} />
						<Route path="/applications/:id" element={<div>Application detail</div>} />
					</Routes>
				</ToastProvider>
			</AuthProvider>
		</MemoryRouter>
	);
}

describe("DashboardPage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.mocked(dashboardApi.getDashboardStatistics).mockResolvedValue(SAMPLE_STATS);
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
});
