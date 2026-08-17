import { apiClient } from "./client";
import type { DashboardStatistics } from "../types/dashboard";

export async function getDashboardStatistics(): Promise<DashboardStatistics> {
	const response = await apiClient.get<DashboardStatistics>("/api/dashboard/statistics");
	return response.data;
}
