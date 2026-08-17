import { apiClient } from "./client";
import type {
	Application,
	ApplicationStatus,
	Contact,
	CreateApplicationRequest,
	CreateContactRequest,
	CreateInterviewRequest,
	CreateNoteRequest,
	Interview,
	Note,
	Page,
	StatusHistoryEntry,
	UpdateApplicationRequest,
} from "../types/application";

export async function listApplications(): Promise<Page<Application>> {
	const response = await apiClient.get<Page<Application>>("/api/applications");
	return response.data;
}

export async function getApplication(id: string): Promise<Application> {
	const response = await apiClient.get<Application>(`/api/applications/${id}`);
	return response.data;
}

export async function changeApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
	const response = await apiClient.post<Application>(`/api/applications/${id}/status`, { status });
	return response.data;
}

export async function getApplicationHistory(id: string): Promise<StatusHistoryEntry[]> {
	const response = await apiClient.get<StatusHistoryEntry[]>(`/api/applications/${id}/history`);
	return response.data;
}

export async function listNotes(applicationId: string): Promise<Note[]> {
	const response = await apiClient.get<Note[]>(`/api/applications/${applicationId}/notes`);
	return response.data;
}

export async function createNote(applicationId: string, request: CreateNoteRequest): Promise<Note> {
	const response = await apiClient.post<Note>(`/api/applications/${applicationId}/notes`, request);
	return response.data;
}

export async function listInterviews(applicationId: string): Promise<Interview[]> {
	const response = await apiClient.get<Interview[]>(`/api/applications/${applicationId}/interviews`);
	return response.data;
}

export async function createInterview(applicationId: string, request: CreateInterviewRequest): Promise<Interview> {
	const response = await apiClient.post<Interview>(`/api/applications/${applicationId}/interviews`, request);
	return response.data;
}

export async function listContacts(applicationId: string): Promise<Contact[]> {
	const response = await apiClient.get<Contact[]>(`/api/applications/${applicationId}/contacts`);
	return response.data;
}

export async function createContact(applicationId: string, request: CreateContactRequest): Promise<Contact> {
	const response = await apiClient.post<Contact>(`/api/applications/${applicationId}/contacts`, request);
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
