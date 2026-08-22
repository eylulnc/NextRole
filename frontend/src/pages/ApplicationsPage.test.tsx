import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApplicationsPage } from "./ApplicationsPage";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { ThemeProvider } from "../context/ThemeContext";
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

function renderApplicationsPage(initialEntries: Parameters<typeof MemoryRouter>[0]["initialEntries"] = ["/applications"]) {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			<ThemeProvider>
				<AuthProvider>
					<ToastProvider>
						<ApplicationsPage />
					</ToastProvider>
				</AuthProvider>
			</ThemeProvider>
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

	it("opens the create modal when clicking + New application", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage());
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByText("+ New application"));

		expect(await screen.findByRole("heading", { name: "New application" })).toBeInTheDocument();
	});

	it("deletes an application after confirmation", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage());
		vi.mocked(applicationsApi.deleteApplication).mockResolvedValue(undefined);
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByLabelText("Actions for Acme Corp"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

		await waitFor(() => {
			expect(applicationsApi.deleteApplication).toHaveBeenCalledWith("app-1");
		});
	});

	it("does not delete when the confirm dialog is cancelled", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage());
		vi.mocked(applicationsApi.deleteApplication).mockResolvedValue(undefined);
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByLabelText("Actions for Acme Corp"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));

		expect(applicationsApi.deleteApplication).not.toHaveBeenCalled();
	});

	it("shows a search-specific empty state, not the generic one, when a search filter has no matches after a delete", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", role: "Frontend Engineer" };
		vi.mocked(applicationsApi.listApplications)
			.mockResolvedValueOnce(samplePage([SAMPLE_APPLICATION, other]))
			.mockResolvedValueOnce(samplePage([other]));
		vi.mocked(applicationsApi.deleteApplication).mockResolvedValue(undefined);
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.type(screen.getByPlaceholderText("Search company or role"), "Acme");
		await userEvent.click(screen.getByLabelText("Actions for Acme Corp"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

		expect(await screen.findByText("No applications match your search.", { exact: false })).toBeInTheDocument();
		expect(screen.queryByText("No applications yet. Add your first one.")).not.toBeInTheDocument();

		await userEvent.click(screen.getByText("Clear search"));

		expect(await screen.findByText("Globex")).toBeInTheDocument();
	});

	it("filters applications by status", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", status: "OFFER" };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, other]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.selectOptions(screen.getByDisplayValue("Statuses"), "OFFER");

		expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
		expect(screen.getByText("Globex")).toBeInTheDocument();
	});

	it("filters applications by work mode", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", workMode: "REMOTE" };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, other]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.selectOptions(screen.getByDisplayValue("Work Modes"), "REMOTE");

		expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
		expect(screen.getByText("Globex")).toBeInTheDocument();
	});

	it("filters applications by tech stack", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", techStack: "React, TypeScript" };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, other]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.type(screen.getByPlaceholderText("Tech stack"), "React");

		expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
		expect(screen.getByText("Globex")).toBeInTheDocument();
	});

	it("filters applications by location", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", location: "Munich" };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, other]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.type(screen.getByPlaceholderText("Location"), "Munich");

		expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
		expect(screen.getByText("Globex")).toBeInTheDocument();
	});

	it("filters applications by application date range", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", applicationDate: "2026-06-01" };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, other]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.type(screen.getByLabelText("From"), "2026-07-01");

		expect(screen.queryByText("Globex")).not.toBeInTheDocument();
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
	});

	it("filters applications by salary range", async () => {
		const cheap: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", salaryMin: 40000, salaryMax: 50000 };
		const expensive: Application = { ...SAMPLE_APPLICATION, id: "app-3", company: "Initrode", salaryMin: 120000, salaryMax: 140000 };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, cheap, expensive]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.type(screen.getByPlaceholderText("Min salary"), "60000");
		await userEvent.type(screen.getByPlaceholderText("Max salary"), "100000");

		expect(screen.queryByText("Globex")).not.toBeInTheDocument();
		expect(screen.queryByText("Initrode")).not.toBeInTheDocument();
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
	});

	it("excludes applications whose salary range only overlaps the filter, not fully contains it", async () => {
		const wideRange: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", salaryMin: 50000, salaryMax: 150000 };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, wideRange]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.type(screen.getByPlaceholderText("Min salary"), "70000");
		await userEvent.type(screen.getByPlaceholderText("Max salary"), "100000");

		// Globex's range (50k-150k) overlaps 70k-100k but isn't contained by it, so it should be excluded.
		expect(screen.queryByText("Globex")).not.toBeInTheDocument();
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
	});

	it("shows an active filter count badge and clears all filters", async () => {
		const other: Application = { ...SAMPLE_APPLICATION, id: "app-2", company: "Globex", status: "OFFER" };
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage([SAMPLE_APPLICATION, other]));
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByRole("button", { name: "Filters" }));
		await userEvent.selectOptions(screen.getByDisplayValue("Statuses"), "OFFER");

		expect(await screen.findByText("1")).toBeInTheDocument();

		await userEvent.click(screen.getByText("Clear all"));

		expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Globex")).toBeInTheDocument();
	});

	it("does not show the filters button in board view", async () => {
		vi.mocked(applicationsApi.listApplications).mockResolvedValue(samplePage());
		renderApplicationsPage();

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByText("Board"));

		expect(await screen.findByText("Saved")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Filters" })).not.toBeInTheDocument();
	});
});
