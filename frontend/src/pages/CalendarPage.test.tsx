import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CalendarPage } from "./CalendarPage";
import { AuthProvider } from "../context/AuthContext";
import * as calendarApi from "../api/calendar";
import type { UpcomingInterview } from "../types/dashboard";

vi.mock("../api/calendar");

function renderCalendar() {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	return render(
		<MemoryRouter initialEntries={["/calendar"]}>
			<AuthProvider>
				<Routes>
					<Route path="/calendar" element={<CalendarPage />} />
					<Route path="/applications/:id" element={<div>Application detail</div>} />
				</Routes>
			</AuthProvider>
		</MemoryRouter>
	);
}

describe("CalendarPage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("shows an empty state when there are no interviews", async () => {
		vi.mocked(calendarApi.getCalendarInterviews).mockResolvedValue([]);
		renderCalendar();

		expect(await screen.findByText("No interviews scheduled.")).toBeInTheDocument();
	});

	it("lists upcoming interviews and navigates to the application on click", async () => {
		const future: UpcomingInterview = {
			applicationId: "app-1",
			company: "Acme Corp",
			role: "Backend Engineer",
			round: "HR Screen",
			scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
		};
		vi.mocked(calendarApi.getCalendarInterviews).mockResolvedValue([future]);
		renderCalendar();

		await userEvent.click(await screen.findByText("Acme Corp"));

		expect(await screen.findByText("Application detail")).toBeInTheDocument();
	});

	it("shows a past interview when clicking the day it happened on", async () => {
		const past = new Date();
		past.setHours(past.getHours() - 2);
		const pastInterview: UpcomingInterview = {
			applicationId: "app-2",
			company: "Legacy Corp",
			role: "Engineer",
			round: "Technical",
			scheduledAt: past.toISOString(),
		};
		vi.mocked(calendarApi.getCalendarInterviews).mockResolvedValue([pastInterview]);
		renderCalendar();

		await screen.findByText("No interviews scheduled.");
		const key = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
		await userEvent.click(screen.getByTestId(`calendar-day-${key}`));

		expect(await screen.findByText("Legacy Corp")).toBeInTheDocument();
		expect(screen.getByText("View upcoming")).toBeInTheDocument();
	});

	it("navigates between months", async () => {
		vi.mocked(calendarApi.getCalendarInterviews).mockResolvedValue([]);
		renderCalendar();

		const headings = await screen.findAllByRole("heading", { level: 3 });
		const initialLabel = headings[0].textContent;
		await userEvent.click(screen.getByLabelText("Next month"));

		const nextLabel = screen.getAllByRole("heading", { level: 3 })[0].textContent;
		expect(nextLabel).not.toBe(initialLabel);
	});
});
