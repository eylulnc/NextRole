import { apiClient } from "./client";

export interface UserSettings {
	language: string;
	defaultCurrency: string;
}

export interface UpdateUserSettingsRequest {
	language?: string;
	defaultCurrency?: string;
}

export async function getSettings(): Promise<UserSettings> {
	const response = await apiClient.get<UserSettings>("/api/settings");
	return response.data;
}

export async function updateSettings(request: UpdateUserSettingsRequest): Promise<UserSettings> {
	const response = await apiClient.patch<UserSettings>("/api/settings", request);
	return response.data;
}
