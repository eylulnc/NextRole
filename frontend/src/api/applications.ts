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
	UpdateContactRequest,
	UpdateInterviewRequest,
	UpdateNoteRequest,
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

export async function updateNote(applicationId: string, noteId: string, request: UpdateNoteRequest): Promise<Note> {
	const response = await apiClient.patch<Note>(`/api/applications/${applicationId}/notes/${noteId}`, request);
	return response.data;
}

export async function deleteNote(applicationId: string, noteId: string): Promise<void> {
	await apiClient.delete(`/api/applications/${applicationId}/notes/${noteId}`);
}

export async function listInterviews(applicationId: string): Promise<Interview[]> {
	const response = await apiClient.get<Interview[]>(`/api/applications/${applicationId}/interviews`);
	return response.data;
}

export async function createInterview(applicationId: string, request: CreateInterviewRequest): Promise<Interview> {
	const response = await apiClient.post<Interview>(`/api/applications/${applicationId}/interviews`, request);
	return response.data;
}

export async function updateInterview(
	applicationId: string,
	interviewId: string,
	request: UpdateInterviewRequest
): Promise<Interview> {
	const response = await apiClient.patch<Interview>(
		`/api/applications/${applicationId}/interviews/${interviewId}`,
		request
	);
	return response.data;
}

export async function deleteInterview(applicationId: string, interviewId: string): Promise<void> {
	await apiClient.delete(`/api/applications/${applicationId}/interviews/${interviewId}`);
}

export async function listContacts(applicationId: string): Promise<Contact[]> {
	const response = await apiClient.get<Contact[]>(`/api/applications/${applicationId}/contacts`);
	return response.data;
}

export async function createContact(applicationId: string, request: CreateContactRequest): Promise<Contact> {
	const response = await apiClient.post<Contact>(`/api/applications/${applicationId}/contacts`, request);
	return response.data;
}

export async function updateContact(
	applicationId: string,
	contactId: string,
	request: UpdateContactRequest
): Promise<Contact> {
	const response = await apiClient.patch<Contact>(
		`/api/applications/${applicationId}/contacts/${contactId}`,
		request
	);
	return response.data;
}

export async function deleteContact(applicationId: string, contactId: string): Promise<void> {
	await apiClient.delete(`/api/applications/${applicationId}/contacts/${contactId}`);
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
