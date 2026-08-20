import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApplicationDetailPage } from "./ApplicationDetailPage";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import * as applicationsApi from "../api/applications";
import type { Application, Contact, Interview, Note, StatusHistoryEntry } from "../types/application";

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
				<ToastProvider>
					<Routes>
						<Route path="/applications/:id" element={<ApplicationDetailPage />} />
					</Routes>
				</ToastProvider>
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
		vi.mocked(applicationsApi.listNotes).mockResolvedValue([]);
		vi.mocked(applicationsApi.listInterviews).mockResolvedValue([]);
		vi.mocked(applicationsApi.listContacts).mockResolvedValue([]);
	});

	it("renders the application overview by default", async () => {
		renderDetailPage();

		expect(await screen.findByRole("heading", { name: "Backend Engineer" })).toBeInTheDocument();
		expect(screen.getByText("Build great APIs.")).toBeInTheDocument();
		expect(screen.getByText("Kotlin")).toBeInTheDocument();
		expect(screen.getByText("Applied: Aug 1, 2026")).toBeInTheDocument();
	});

	it("shows 'Not applied yet' when still in the saved stage, even if an application date is set", async () => {
		vi.mocked(applicationsApi.getApplication).mockResolvedValue({ ...SAMPLE_APPLICATION, status: "SAVED" });
		renderDetailPage();

		expect(await screen.findByRole("heading", { name: "Backend Engineer" })).toBeInTheDocument();
		expect(screen.getByText("Not applied yet")).toBeInTheDocument();
		expect(screen.queryByText("Applied: Aug 1, 2026")).not.toBeInTheDocument();
	});

	it("edits the job description inline from the overview tab", async () => {
		const updated = { ...SAMPLE_APPLICATION, jobDescription: "Build great APIs, remotely." };
		vi.mocked(applicationsApi.updateApplication).mockResolvedValue(updated);
		vi.mocked(applicationsApi.getApplication)
			.mockResolvedValueOnce(SAMPLE_APPLICATION)
			.mockResolvedValueOnce(updated);
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByLabelText("Edit"));

		const textarea = screen.getByDisplayValue("Build great APIs.");
		await userEvent.clear(textarea);
		await userEvent.type(textarea, "Build great APIs, remotely.");
		await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => {
			expect(applicationsApi.updateApplication).toHaveBeenCalledWith("app-1", {
				jobDescription: "Build great APIs, remotely.",
			});
		});
		expect(await screen.findByText("Build great APIs, remotely.")).toBeInTheDocument();
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

	it("shows notes and adds a new one", async () => {
		const existingNote: Note = { id: "n1", text: "First call went well.", createdAt: "2026-08-01T00:00:00Z" };
		vi.mocked(applicationsApi.listNotes).mockResolvedValue([existingNote]);
		vi.mocked(applicationsApi.createNote).mockResolvedValue({ id: "n2", text: "Second note", createdAt: "2026-08-02T00:00:00Z" });
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Notes"));

		expect(screen.getByText("First call went well.")).toBeInTheDocument();

		await userEvent.click(screen.getByLabelText("Add note"));
		await userEvent.type(screen.getByPlaceholderText("Add a note…"), "Second note");
		await userEvent.click(screen.getByRole("button", { name: "Add note" }));

		await waitFor(() => {
			expect(applicationsApi.createNote).toHaveBeenCalledWith("app-1", { text: "Second note" });
		});
	});

	it("shows contacts and adds a new one", async () => {
		const existingContact: Contact = { id: "c1", name: "Lena Fischer", role: "Talent Partner", email: null, createdAt: "2026-08-01T00:00:00Z" };
		vi.mocked(applicationsApi.listContacts).mockResolvedValue([existingContact]);
		vi.mocked(applicationsApi.createContact).mockResolvedValue({
			id: "c2",
			name: "Jonas Weber",
			role: null,
			email: null,
			createdAt: "2026-08-02T00:00:00Z",
		});
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Contacts"));

		expect(screen.getByText("Lena Fischer")).toBeInTheDocument();

		await userEvent.click(screen.getByLabelText("Add contact"));
		await userEvent.type(screen.getByPlaceholderText("Name"), "Jonas Weber");
		await userEvent.click(screen.getByRole("button", { name: "Add contact" }));

		await waitFor(() => {
			expect(applicationsApi.createContact).toHaveBeenCalledWith("app-1", { name: "Jonas Weber", role: undefined, email: undefined });
		});
	});

	it("shows interviews", async () => {
		const existingInterview: Interview = {
			id: "iv1",
			round: "HR Screen",
			interviewer: "Lena Fischer",
			scheduledAt: "2026-08-05T10:00:00Z",
			mode: "Video call",
			notes: null,
			createdAt: "2026-08-01T00:00:00Z",
		};
		vi.mocked(applicationsApi.listInterviews).mockResolvedValue([existingInterview]);
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Interviews"));

		expect(screen.getByText("HR Screen")).toBeInTheDocument();
	});

	it("edits an existing note", async () => {
		const existingNote: Note = { id: "n1", text: "First call went well.", createdAt: "2026-08-01T00:00:00Z" };
		vi.mocked(applicationsApi.listNotes).mockResolvedValue([existingNote]);
		vi.mocked(applicationsApi.updateNote).mockResolvedValue({ ...existingNote, text: "Updated note" });
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Notes"));
		await userEvent.click(screen.getByLabelText("Note actions"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));

		const textarea = screen.getByPlaceholderText("Add a note…");
		expect(textarea).toHaveValue("First call went well.");
		await userEvent.clear(textarea);
		await userEvent.type(textarea, "Updated note");
		await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => {
			expect(applicationsApi.updateNote).toHaveBeenCalledWith("app-1", "n1", { text: "Updated note" });
		});
	});

	it("deletes a note after confirmation", async () => {
		const existingNote: Note = { id: "n1", text: "First call went well.", createdAt: "2026-08-01T00:00:00Z" };
		vi.mocked(applicationsApi.listNotes).mockResolvedValue([existingNote]);
		vi.mocked(applicationsApi.deleteNote).mockResolvedValue(undefined);
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Notes"));
		await userEvent.click(screen.getByLabelText("Note actions"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

		await waitFor(() => {
			expect(applicationsApi.deleteNote).toHaveBeenCalledWith("app-1", "n1");
		});
	});

	it("toggles note sort order between newest and oldest first", async () => {
		const notes: Note[] = [
			{ id: "n1", text: "Newest note", createdAt: "2026-08-03T00:00:00Z" },
			{ id: "n2", text: "Oldest note", createdAt: "2026-08-01T00:00:00Z" },
		];
		vi.mocked(applicationsApi.listNotes).mockResolvedValue(notes);
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Notes"));

		const getNoteOrder = () => screen.getAllByText(/Newest note|Oldest note/).map((el) => el.textContent);
		expect(getNoteOrder()).toEqual(["Newest note", "Oldest note"]);
		expect(screen.getByRole("button", { name: /Newest first/ })).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: /Newest first/ }));
		expect(getNoteOrder()).toEqual(["Oldest note", "Newest note"]);
		expect(screen.getByRole("button", { name: /Oldest first/ })).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: /Oldest first/ }));
		expect(getNoteOrder()).toEqual(["Newest note", "Oldest note"]);
	});

	it("edits an existing contact", async () => {
		const existingContact: Contact = { id: "c1", name: "Lena Fischer", role: "Talent Partner", email: null, createdAt: "2026-08-01T00:00:00Z" };
		vi.mocked(applicationsApi.listContacts).mockResolvedValue([existingContact]);
		vi.mocked(applicationsApi.updateContact).mockResolvedValue({ ...existingContact, role: "Recruiter" });
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Contacts"));
		await userEvent.click(screen.getByLabelText("Actions for Lena Fischer"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));

		const roleInput = screen.getByPlaceholderText("Role");
		await userEvent.clear(roleInput);
		await userEvent.type(roleInput, "Recruiter");
		await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => {
			expect(applicationsApi.updateContact).toHaveBeenCalledWith("app-1", "c1", {
				name: "Lena Fischer",
				role: "Recruiter",
				email: undefined,
			});
		});
	});

	it("deletes an interview after confirmation", async () => {
		const existingInterview: Interview = {
			id: "iv1",
			round: "HR Screen",
			interviewer: "Lena Fischer",
			scheduledAt: "2026-08-05T10:00:00Z",
			mode: "Video call",
			notes: null,
			createdAt: "2026-08-01T00:00:00Z",
		};
		vi.mocked(applicationsApi.listInterviews).mockResolvedValue([existingInterview]);
		vi.mocked(applicationsApi.deleteInterview).mockResolvedValue(undefined);
		renderDetailPage();

		await screen.findByRole("heading", { name: "Backend Engineer" });
		await userEvent.click(screen.getByText("Interviews"));
		await userEvent.click(screen.getByLabelText("Actions for HR Screen"));
		await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

		await waitFor(() => {
			expect(applicationsApi.deleteInterview).toHaveBeenCalledWith("app-1", "iv1");
		});
	});
});
