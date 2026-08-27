import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PipelineStagesModal } from "./PipelineStagesModal";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { PipelineStagesProvider } from "../context/PipelineStagesContext";
import { SAMPLE_STAGES } from "../test/pipelineStagesFixture";
import * as pipelineStagesApi from "../api/pipelineStages";

vi.mock("../api/pipelineStages");

function renderModal(onClose = vi.fn()) {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	return {
		onClose,
		...render(
			<AuthProvider>
				<PipelineStagesProvider>
					<ToastProvider>
						<PipelineStagesModal onClose={onClose} />
					</ToastProvider>
				</PipelineStagesProvider>
			</AuthProvider>
		),
	};
}

describe("PipelineStagesModal", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue(SAMPLE_STAGES);
	});

	it("lists all stages without a delete button for built-in stages", async () => {
		renderModal();

		expect(await screen.findByText("Saved")).toBeInTheDocument();
		expect(screen.getByText("Rejected")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
	});

	it("hides a stage immediately when it has no applications", async () => {
		vi.mocked(pipelineStagesApi.updatePipelineStage).mockResolvedValue({ ...SAMPLE_STAGES[0], visible: false });
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValueOnce(SAMPLE_STAGES).mockResolvedValueOnce(
			SAMPLE_STAGES.map((s) => (s.id === "stage-saved" ? { ...s, visible: false } : s))
		);
		renderModal();

		await screen.findByText("Saved");
		await userEvent.click(screen.getAllByRole("button", { name: "Hide" })[0]);

		await waitFor(() => {
			expect(pipelineStagesApi.updatePipelineStage).toHaveBeenCalledWith("stage-saved", { visible: false });
		});
	});

	it("opens the reassign dialog instead of hiding when the stage has applications", async () => {
		const stagesWithApps = SAMPLE_STAGES.map((s) => (s.id === "stage-saved" ? { ...s, applicationCount: 3 } : s));
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue(stagesWithApps);
		renderModal();

		await screen.findByText("Saved");
		await userEvent.click(screen.getAllByRole("button", { name: "Hide" })[0]);

		expect(pipelineStagesApi.updatePipelineStage).not.toHaveBeenCalled();
		expect(await screen.findByText('3 applications are in "Saved"')).toBeInTheDocument();
	});

	it("bulk-reassigns applications then hides the stage on confirm", async () => {
		const stagesWithApps = SAMPLE_STAGES.map((s) => (s.id === "stage-saved" ? { ...s, applicationCount: 3 } : s));
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue(stagesWithApps);
		vi.mocked(pipelineStagesApi.reassignPipelineStage).mockResolvedValue({ movedCount: 3 });
		vi.mocked(pipelineStagesApi.updatePipelineStage).mockResolvedValue({ ...stagesWithApps[0], visible: false });
		renderModal();

		await screen.findByText("Saved");
		await userEvent.click(screen.getAllByRole("button", { name: "Hide" })[0]);
		await screen.findByText('3 applications are in "Saved"');

		const dialogs = screen.getAllByRole("dialog");
		const reassignDialog = dialogs[dialogs.length - 1];
		await userEvent.click(within(reassignDialog).getByRole("button", { name: /Move 3 and hide/ }));

		await waitFor(() => {
			expect(pipelineStagesApi.reassignPipelineStage).toHaveBeenCalledWith("stage-saved", "stage-applied");
			expect(pipelineStagesApi.updatePipelineStage).toHaveBeenCalledWith("stage-saved", { visible: false });
		});
		expect(await screen.findByText("Moved 3 applications")).toBeInTheDocument();
	});

	it("opens the reassign dialog instead of deleting when the custom stage has applications", async () => {
		const customStage = { ...SAMPLE_STAGES[0], id: "stage-custom", key: "CODING_ASSIGNMENT", label: "Coding Assignment", isBuiltIn: false, applicationCount: 2 };
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue([...SAMPLE_STAGES, customStage]);
		renderModal();

		await screen.findByText("Coding Assignment");
		const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
		await userEvent.click(deleteButtons[deleteButtons.length - 1]);

		expect(pipelineStagesApi.deletePipelineStage).not.toHaveBeenCalled();
		expect(await screen.findByText('2 applications are in "Coding Assignment"')).toBeInTheDocument();
	});

	it("deletes a custom stage with no applications after confirmation", async () => {
		const customStage = { ...SAMPLE_STAGES[0], id: "stage-custom", key: "CODING_ASSIGNMENT", label: "Coding Assignment", isBuiltIn: false, applicationCount: 0 };
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue([...SAMPLE_STAGES, customStage]);
		vi.mocked(pipelineStagesApi.deletePipelineStage).mockResolvedValue(undefined);
		renderModal();

		await screen.findByText("Coding Assignment");
		const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
		await userEvent.click(deleteButtons[deleteButtons.length - 1]);

		const dialogs = await screen.findAllByRole("dialog");
		const confirmDialog = dialogs[dialogs.length - 1];
		await userEvent.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

		await waitFor(() => {
			expect(pipelineStagesApi.deletePipelineStage).toHaveBeenCalledWith("stage-custom");
		});
	});

	it("rejects adding a stage with a name that already exists", async () => {
		renderModal();

		await screen.findByText("Saved");
		await userEvent.type(screen.getByPlaceholderText("New stage name"), "saved");
		await userEvent.click(screen.getByRole("button", { name: "Add" }));

		expect(await screen.findByText('A stage named "saved" already exists')).toBeInTheDocument();
		expect(pipelineStagesApi.createPipelineStage).not.toHaveBeenCalled();
	});

	it("adds a stage with a unique name", async () => {
		vi.mocked(pipelineStagesApi.createPipelineStage).mockResolvedValue({
			id: "stage-new",
			key: "CODING_ASSIGNMENT",
			label: "Coding Assignment",
			orderIndex: 7,
			hue: 100,
			category: "ACTIVE",
			isBuiltIn: false,
			visible: true,
			applicationCount: 0,
		});
		renderModal();

		await screen.findByText("Saved");
		await userEvent.type(screen.getByPlaceholderText("New stage name"), "Coding Assignment");
		await userEvent.click(screen.getByRole("button", { name: "Add" }));

		await waitFor(() => {
			expect(pipelineStagesApi.createPipelineStage).toHaveBeenCalledWith({ label: "Coding Assignment" });
		});
	});

	it("groups hidden stages at the bottom of the list", async () => {
		const stagesWithHidden = SAMPLE_STAGES.map((s) => (s.id === "stage-applied" ? { ...s, visible: false } : s));
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValue(stagesWithHidden);
		renderModal();

		await screen.findByText("Saved");
		const labels = screen.getAllByText(/Saved|Applied|HR Interview|Technical|Final Round|Offer|Rejected/).map((el) => el.textContent);
		expect(labels[labels.length - 1]).toBe("Applied");
	});

	it("reorders stages by dragging one row onto another", async () => {
		vi.mocked(pipelineStagesApi.reorderPipelineStages).mockResolvedValue(SAMPLE_STAGES);
		renderModal();

		const savedRow = (await screen.findByText("Saved")).closest("div[draggable]") as HTMLElement;
		const hrRow = screen.getByText("HR Interview").closest("div[draggable]") as HTMLElement;

		const dataTransfer = { effectAllowed: "" };
		fireEvent.dragStart(savedRow, { dataTransfer });
		fireEvent.dragOver(hrRow, { dataTransfer });
		fireEvent.drop(hrRow, { dataTransfer });

		await waitFor(() => {
			expect(pipelineStagesApi.reorderPipelineStages).toHaveBeenCalledWith([
				"stage-applied",
				"stage-hr",
				"stage-saved",
				"stage-technical",
				"stage-final",
				"stage-offer",
				"stage-rejected",
			]);
		});
	});

	it("resets to the original order after a drag reorder", async () => {
		const reorderedStages = [
			SAMPLE_STAGES[1],
			SAMPLE_STAGES[2],
			SAMPLE_STAGES[0],
			SAMPLE_STAGES[3],
			SAMPLE_STAGES[4],
			SAMPLE_STAGES[5],
			SAMPLE_STAGES[6],
		].map((s, index) => ({ ...s, orderIndex: index }));
		vi.mocked(pipelineStagesApi.listPipelineStages).mockResolvedValueOnce(SAMPLE_STAGES).mockResolvedValue(reorderedStages);
		vi.mocked(pipelineStagesApi.reorderPipelineStages).mockResolvedValue(reorderedStages);
		renderModal();

		await screen.findByText("Saved");
		expect(screen.getByRole("button", { name: "Reset to original order" })).toBeDisabled();

		const savedRow = screen.getByText("Saved").closest("div[draggable]") as HTMLElement;
		const hrRow = screen.getByText("HR Interview").closest("div[draggable]") as HTMLElement;
		const dataTransfer = { effectAllowed: "" };
		fireEvent.dragStart(savedRow, { dataTransfer });
		fireEvent.dragOver(hrRow, { dataTransfer });
		fireEvent.drop(hrRow, { dataTransfer });

		await waitFor(() => expect(pipelineStagesApi.reorderPipelineStages).toHaveBeenCalledTimes(1));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Reset to original order" })).not.toBeDisabled();
		});

		await userEvent.click(screen.getByRole("button", { name: "Reset to original order" }));

		await waitFor(() => {
			expect(pipelineStagesApi.reorderPipelineStages).toHaveBeenLastCalledWith([
				"stage-saved",
				"stage-applied",
				"stage-hr",
				"stage-technical",
				"stage-final",
				"stage-offer",
				"stage-rejected",
			]);
		});
	});
});
