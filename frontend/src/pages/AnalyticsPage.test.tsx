import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AnalyticsPage } from "./AnalyticsPage";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import * as analyticsApi from "../api/analytics";
import type { Analytics } from "../types/analytics";

vi.mock("../api/analytics");

const SAMPLE_ANALYTICS: Analytics = {
	funnelStages: [
		{ status: "SAVED", count: 1 },
		{ status: "APPLIED", count: 2 },
		{ status: "HR_INTERVIEW", count: 0 },
		{ status: "TECHNICAL", count: 1 },
		{ status: "FINAL", count: 0 },
		{ status: "OFFER", count: 0 },
		{ status: "REJECTED", count: 0 },
	],
	applicationsOverTime: [
		{ month: "2026-03", count: 1 },
		{ month: "2026-04", count: 2 },
	],
	topTechnologies: [
		{ technology: "Kotlin", count: 3 },
		{ technology: "React", count: 1 },
	],
	stageConversionRates: [
		{ status: "SAVED", conversionRatePercent: 50 },
		{ status: "APPLIED", conversionRatePercent: 25 },
	],
	applicationsByWorkMode: [
		{ workMode: "REMOTE", count: 2 },
		{ workMode: "HYBRID", count: 0 },
		{ workMode: "ONSITE", count: 1 },
	],
};

function renderAnalytics() {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	return render(
		<MemoryRouter initialEntries={["/analytics"]}>
			<AuthProvider>
				<ToastProvider>
					<Routes>
						<Route path="/analytics" element={<AnalyticsPage />} />
					</Routes>
				</ToastProvider>
			</AuthProvider>
		</MemoryRouter>
	);
}

describe("AnalyticsPage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.mocked(analyticsApi.getAnalytics).mockResolvedValue(SAMPLE_ANALYTICS);
	});

	it("renders funnel, technologies, and stage conversion rates from the analytics response", async () => {
		renderAnalytics();

		expect(await screen.findByText("Kotlin")).toBeInTheDocument();
		expect(screen.getByText("React")).toBeInTheDocument();
		expect(screen.getAllByText("Saved").length).toBeGreaterThan(0);
		expect(screen.getByText("50%")).toBeInTheDocument();
		expect(screen.getByText("Remote")).toBeInTheDocument();
	});

	it("shows an empty state when there is no tech stack data", async () => {
		vi.mocked(analyticsApi.getAnalytics).mockResolvedValue({ ...SAMPLE_ANALYTICS, topTechnologies: [] });
		renderAnalytics();

		expect(await screen.findByText("No tech stack data yet.")).toBeInTheDocument();
	});
});
