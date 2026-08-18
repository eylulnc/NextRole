import { apiClient } from "./client";
import type { UpcomingInterview } from "../types/dashboard";

export async function getCalendarInterviews(): Promise<UpcomingInterview[]> {
	const response = await apiClient.get<UpcomingInterview[]>("/api/calendar/interviews");
	return response.data;
}
