import { apiClient } from "./client";
import type { InterviewReminderMode } from "./auth";

export interface UserSettings {
	language: string;
	defaultCurrency: string;
	interviewReminderMode: InterviewReminderMode;
	interviewReminderHours: number;
	interviewReminderPrompted: boolean;
}

export interface UpdateUserSettingsRequest {
	language?: string;
	defaultCurrency?: string;
	interviewReminderMode?: InterviewReminderMode;
	interviewReminderHours?: number;
	interviewReminderPrompted?: boolean;
}

export async function getSettings(): Promise<UserSettings> {
	const response = await apiClient.get<UserSettings>("/api/settings");
	return response.data;
}

export async function updateSettings(request: UpdateUserSettingsRequest): Promise<UserSettings> {
	const response = await apiClient.patch<UserSettings>("/api/settings", request);
	return response.data;
}
