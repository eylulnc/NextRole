import { apiClient } from "./client";

export type InterviewReminderMode = "OFF" | "ALWAYS" | "HOURS";

export interface AuthResponse {
	token: string;
	email: string;
	language: string;
	defaultCurrency: string;
	interviewReminderMode: InterviewReminderMode;
	interviewReminderHours: number;
	interviewReminderPrompted: boolean;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
	const response = await apiClient.post<AuthResponse>("/api/auth/register", { email, password });
	return response.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
	const response = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
	return response.data;
}
