import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationBoard } from "./ApplicationBoard";
import type { Application } from "../types/application";
import { AuthProvider } from "../context/AuthContext";
import { PipelineStagesProvider } from "../context/PipelineStagesContext";
import { SAMPLE_STAGES } from "../test/pipelineStagesFixture";
import * as pipelineStagesApi from "../api/pipelineStages";

vi.mock("../api/pipelineStages");

function fakeDataTransfer() {
	let stored = "";
	return {
		setData: (_type: string, value: string) => {
			stored = value;
		},
		getData: () => stored,
		effectAllowed: "",
	};
}

const APP_APPLIED: Application = {
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

function renderBoard(
	applications: Application[],
	onStatusChange = vi.fn(),
	onAddToStatus = vi.fn(),
	onEdit = vi.fn(),
	onDelete = vi.fn()
) {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	render(
		<MemoryRouter initialEntries={["/applications"]}>
			<AuthProvider>
				<PipelineStagesProvider>
					<Routes>
						<Route
							path="/applications"
							element={
								<ApplicationBoard
									applications={applications}
									onStatusChange={onStatusChange}
									onAddToStatus={onAddToStatus}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							}
						/>
						<Route path="/applications/:id" element={<div>Application detail</div>} />
					</Routes>
				</PipelineStagesProvider>
			</AuthProvider>
		</MemoryRouter>
	);
	return { onStatusChange, onAddToStatus, onEdit, onDelete };
}

describe("ApplicationBoard", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue(SAMPLE_STAGES);
	});

	it("groups applications into columns by status with counts", async () => {
		renderBoard([APP_APPLIED]);

		expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Saved")).toBeInTheDocument();
		expect(screen.getByText("Applied")).toBeInTheDocument();
	});

	it("navigates to the application detail page when clicking a card", async () => {
		renderBoard([APP_APPLIED]);

		await userEvent.click(await screen.findByText("Acme Corp"));

		expect(await screen.findByText("Application detail")).toBeInTheDocument();
	});

	it("shows a header quick-add button only on non-empty columns", async () => {
		const { onAddToStatus } = renderBoard([APP_APPLIED]);

		await screen.findByText("Acme Corp");
		expect(screen.queryByLabelText("Add application to Saved")).not.toBeInTheDocument();

		await userEvent.click(screen.getByLabelText("Add application to Applied"));
		expect(onAddToStatus).toHaveBeenCalledWith("APPLIED");
	});

	it("shows a ghost add tile only on empty columns", async () => {
		const { onAddToStatus } = renderBoard([APP_APPLIED]);

		await screen.findByText("Acme Corp");
		const savedColumn = screen.getByTestId("board-column-SAVED");
		const ghostTile = savedColumn.querySelector("button") as HTMLElement;
		expect(ghostTile).toBeInTheDocument();

		await userEvent.click(ghostTile);
		expect(onAddToStatus).toHaveBeenCalledWith("SAVED");

		const appliedColumn = screen.getByTestId("board-column-APPLIED");
		expect(appliedColumn.querySelectorAll("button")).toHaveLength(2);
	});

	it("opens the kebab menu and triggers edit/delete", async () => {
		const { onEdit, onDelete } = renderBoard([APP_APPLIED]);

		await screen.findByText("Acme Corp");
		await userEvent.click(screen.getByLabelText("Actions for Acme Corp"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
		expect(onEdit).toHaveBeenCalledWith(APP_APPLIED);

		await userEvent.click(screen.getByLabelText("Actions for Acme Corp"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		expect(onDelete).toHaveBeenCalledWith("app-1");
	});

	it("calls onStatusChange with the target column when a card is dropped", async () => {
		const { onStatusChange } = renderBoard([APP_APPLIED]);

		await screen.findByText("Acme Corp");
		const card = screen.getByText("Acme Corp").closest("[draggable]") as HTMLElement;
		const dataTransfer = fakeDataTransfer();

		fireEvent.dragStart(card, { dataTransfer });

		const hrInterviewColumn = screen.getByTestId("board-column-HR_INTERVIEW");

		fireEvent.dragOver(hrInterviewColumn, { dataTransfer });
		fireEvent.drop(hrInterviewColumn, { dataTransfer });

		expect(onStatusChange).toHaveBeenCalledWith("app-1", "HR_INTERVIEW");
	});

	it("shows the first 6 cards of a column and reveals more in steps of 6", async () => {
		const apps = Array.from({ length: 16 }, (_, i) => ({ ...APP_APPLIED, id: `app-${i + 1}`, company: `Company ${i + 1}` }));
		renderBoard(apps);

		await screen.findByText("Company 1");
		expect(screen.getAllByLabelText(/^Actions for /)).toHaveLength(6);
		expect(screen.getByText("16")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Show 6 more" }));
		expect(screen.getAllByLabelText(/^Actions for /)).toHaveLength(12);

		await userEvent.click(screen.getByRole("button", { name: "Show 4 more" }));
		expect(screen.getAllByLabelText(/^Actions for /)).toHaveLength(16);

		await userEvent.click(screen.getByRole("button", { name: "Show less" }));
		expect(screen.getAllByLabelText(/^Actions for /)).toHaveLength(6);
	});

	it("shows no show-more control when a column fits", async () => {
		const apps = Array.from({ length: 6 }, (_, i) => ({ ...APP_APPLIED, id: `app-${i + 1}`, company: `Company ${i + 1}` }));
		renderBoard(apps);

		await screen.findByText("Company 1");
		expect(screen.queryByRole("button", { name: /^Show / })).not.toBeInTheDocument();
	});

	it("orders each column by most recently changed, so a moved card is visible at the top", async () => {
		const older = Array.from({ length: 7 }, (_, i) => ({
			...APP_APPLIED,
			id: `app-${i + 1}`,
			company: `Company ${i + 1}`,
			updatedAt: `2026-08-0${i + 1}T00:00:00Z`,
		}));
		const justMoved = { ...APP_APPLIED, id: "app-moved", company: "Just Moved", updatedAt: "2026-09-01T10:00:00.5Z" };
		renderBoard([...older, justMoved]);

		const names = (await screen.findAllByLabelText(/^Actions for /)).map((el) => el.getAttribute("aria-label"));
		expect(names[0]).toBe("Actions for Just Moved");
		expect(names[1]).toBe("Actions for Company 7");
		expect(names).toHaveLength(6);
	});
});
