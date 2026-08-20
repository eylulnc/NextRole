import { apiClient } from "./client";
import type { Analytics } from "../types/analytics";

export async function getAnalytics(): Promise<Analytics> {
	const response = await apiClient.get<Analytics>("/api/analytics");
	return response.data;
}
