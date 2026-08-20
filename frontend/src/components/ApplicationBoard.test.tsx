import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApplicationBoard } from "./ApplicationBoard";
import type { Application } from "../types/application";

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
	render(
		<MemoryRouter initialEntries={["/applications"]}>
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
		</MemoryRouter>
	);
	return { onStatusChange, onAddToStatus, onEdit, onDelete };
}

describe("ApplicationBoard", () => {
	it("groups applications into columns by status with counts", () => {
		renderBoard([APP_APPLIED]);

		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Saved")).toBeInTheDocument();
		expect(screen.getByText("Applied")).toBeInTheDocument();
	});

	it("navigates to the application detail page when clicking a card", async () => {
		renderBoard([APP_APPLIED]);

		await userEvent.click(screen.getByText("Acme Corp"));

		expect(await screen.findByText("Application detail")).toBeInTheDocument();
	});

	it("shows a header quick-add button only on non-empty columns", async () => {
		const { onAddToStatus } = renderBoard([APP_APPLIED]);

		expect(screen.queryByLabelText("Add application to Saved")).not.toBeInTheDocument();

		await userEvent.click(screen.getByLabelText("Add application to Applied"));
		expect(onAddToStatus).toHaveBeenCalledWith("APPLIED");
	});

	it("shows a ghost add tile only on empty columns", async () => {
		const { onAddToStatus } = renderBoard([APP_APPLIED]);

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

		await userEvent.click(screen.getByLabelText("Actions for Acme Corp"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
		expect(onEdit).toHaveBeenCalledWith(APP_APPLIED);

		await userEvent.click(screen.getByLabelText("Actions for Acme Corp"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		expect(onDelete).toHaveBeenCalledWith("app-1");
	});

	it("calls onStatusChange with the target column when a card is dropped", () => {
		const { onStatusChange } = renderBoard([APP_APPLIED]);

		const card = screen.getByText("Acme Corp").closest("[draggable]") as HTMLElement;
		const dataTransfer = fakeDataTransfer();

		fireEvent.dragStart(card, { dataTransfer });

		const hrInterviewColumn = screen.getByTestId("board-column-HR_INTERVIEW");

		fireEvent.dragOver(hrInterviewColumn, { dataTransfer });
		fireEvent.drop(hrInterviewColumn, { dataTransfer });

		expect(onStatusChange).toHaveBeenCalledWith("app-1", "HR_INTERVIEW");
	});
});
