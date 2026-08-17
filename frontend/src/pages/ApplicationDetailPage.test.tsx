import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApplicationDetailPage } from "./ApplicationDetailPage";
import { AuthProvider } from "../context/AuthContext";
import * as applicationsApi from "../api/applications";
import type { Application, StatusHistoryEntry } from "../types/application";

vi.mock("../api/applications");

const SAMPLE_APPLICATION: Application = {
	id: "app-1",
	company: "Acme Corp",
	role: "Backend Engineer",
	location: "Berlin",
	salaryMin: 70000,
	salaryMax: 85000,
	techStack: "Kotlin, Spring Boot",
	jobDescription: "Build great APIs.",
	applicationDate: "2026-08-01",
	status: "APPLIED",
	notes: null,
	createdAt: "2026-08-01T00:00:00Z",
	updatedAt: "2026-08-01T00:00:00Z",
};

const SAMPLE_HISTORY: StatusHistoryEntry[] = [
	{ id: "h1", status: "SAVED", changedAt: "2026-07-28T00:00:00Z" },
	{ id: "h2", status: "APPLIED", changedAt: "2026-08-01T00:00:00Z" },
];

function renderDetailPage() {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	return render(
		<MemoryRouter initialEntries={["/applications/app-1"]}>
			<AuthProvider>
				<Routes>
					<Route path="/applications/:id" element={<ApplicationDetailPage />} />
				</Routes>
			</AuthProvider>
		</MemoryRouter>
	);
}

describe("ApplicationDetailPage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.mocked(applicationsApi.getApplication).mockResolvedValue(SAMPLE_APPLICATION);
		vi.mocked(applicationsApi.getApplicationHistory).mockResolvedValue(SAMPLE_HISTORY);
	});

	it("renders the application overview by default", async () => {
		renderDetailPage();

		expect(await screen.findByRole("heading", { name: "Backend Engineer" })).toBeInTheDocument();
		expect(screen.getByText("Build great APIs.")).toBeInTheDocument();
		expect(screen.getByText("Kotlin")).toBeInTheDocument();
	});

	it("switches to the status history tab", async () => {
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Status History"));

		expect(screen.getAllByText("Saved").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Applied", { selector: "span" }).length).toBeGreaterThan(0);
	});

	it("changes the application status", async () => {
		vi.mocked(applicationsApi.changeApplicationStatus).mockResolvedValue({
			...SAMPLE_APPLICATION,
			status: "HR_INTERVIEW",
		});
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Change stage"));
		await userEvent.click(screen.getByText("HR Interview"));

		await waitFor(() => {
			expect(applicationsApi.changeApplicationStatus).toHaveBeenCalledWith("app-1", "HR_INTERVIEW");
		});
	});
});
