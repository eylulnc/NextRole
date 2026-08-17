import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApplicationsPage } from "./ApplicationsPage";
import { AuthProvider } from "../context/AuthContext";
import * as applicationsApi from "../api/applications";
import type { Application, Page } from "../types/application";

vi.mock("../api/applications");

const SAMPLE_APPLICATION: Application = {
	id: "app-1",
	company: "Acme Corp",
	role: "Backend Engineer",
	location: "Berlin",
	salaryMin: 70000,
	salaryMax: 85000,
	currency: "EUR",
	workMode: null,
	techStack: "Kotlin, Spring Boot",
	jobDescription: null,
	applicationDate: "2026-08-01",
	status: "APPLIED",
	notes: null,
	createdAt: "2026-08-01T00:00:00Z",
	updatedAt: "2026-08-01T00:00:00Z",
};

function samplePage(content: Application[] = [SAMPLE_APPLICATION]): Page<Application> {
	return { content, totalElements: content.length, totalPages: 1, number: 0, size: 20 };
}

function renderApplicationsPage() {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	return render(
		<MemoryRouter>
			<AuthProvider>
				<ApplicationsPage />
			</AuthProvider>
		</MemoryRouter>
	);
}

describe("ApplicationsPage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("renders the list of applications", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage());
		renderApplicationsPage();

		expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
		expect(screen.getByText("Applied", { selector: "span" })).toBeInTheDocument();
	});

	it("shows an empty state with no applications", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([]));
		renderApplicationsPage();

		expect(await screen.findByText("No applications yet. Add your first one.")).toBeInTheDocument();
	});

	it("filters applications by search text", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", role: "Frontend Engineer" };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, other]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.type(screen.getByPlaceholderText("Search company or role"), "Globex");

		expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
		expect(screen.getByText("Globex")).toBeInTheDocument();
	});

	it("remembers the last selected view across remounts", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage());
		const { unmount } = renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByText("Board"));
		expect(await screen.findByText("Saved")).toBeInTheDocument();

		unmount();
		renderApplicationsPage();

		expect(await screen.findByText("Saved")).toBeInTheDocument();
		expect(screen.queryByText("Company / Role")).not.toBeInTheDocument();
	});

	it("deletes an application after confirmation", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage());
		vi.mocked(applicationsApi.deleteApplication).mockResolvedValue(undefined);
		vi.spyOn(window, "confirm").mockReturnValue(true);
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByLabelText("Delete Acme Corp"));

		await waitFor(() => {
			expect(applicationsApi.deleteApplication).toHaveBeenCalledWith("app-1");
		});
	});
});
