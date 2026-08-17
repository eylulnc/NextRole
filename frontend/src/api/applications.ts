import { apiClient } from "./client";
import type {
	Application,
	CreateApplicationRequest,
	Page,
	UpdateApplicationRequest,
} from "../types/application";

export async function listApplications(): Promise<Page<Application>> {
	const response = await apiClient.get<Page<Application>>("/api/applications");
	return response.data;
}

export async function createApplication(request: CreateApplicationRequest): Promise<Application> {
	const response = await apiClient.post<Application>("/api/applications", request);
	return response.data;
}

export async function updateApplication(
	id: string,
	request: UpdateApplicationRequest
): Promise<Application> {
	const response = await apiClient.patch<Application>(`/api/applications/${id}`, request);
	return response.data;
}

export async function deleteApplication(id: string): Promise<void> {
	await apiClient.delete(`/api/applications/${id}`);
}
