export type ApplicationStatus =
	| "SAVED"
	| "APPLIED"
	| "HR_INTERVIEW"
	| "TECHNICAL"
	| "FINAL"
	| "OFFER"
	| "REJECTED";

export interface Application {
	id: string;
	company: string;
	role: string;
	location: string | null;
	workMode: string | null;
	salaryMin: number | null;
	salaryMax: number | null;
	currency: string;
	techStack: string | null;
	jobDescription: string | null;
	applicationDate: string | null;
	status: ApplicationStatus;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateApplicationRequest {
	company: string;
	role: string;
	location?: string;
	workMode?: string;
	salaryMin?: number;
	salaryMax?: number;
	currency?: string;
	techStack?: string;
	jobDescription?: string;
	applicationDate?: string;
	status?: ApplicationStatus;
	notes?: string;
}

export type UpdateApplicationRequest = Partial<CreateApplicationRequest>;

export interface StatusHistoryEntry {
	id: string;
	status: ApplicationStatus;
	changedAt: string;
}

export interface Note {
	id: string;
	text: string;
	createdAt: string;
}

export interface CreateNoteRequest {
	text: string;
}

export type UpdateNoteRequest = Partial<CreateNoteRequest>;

export interface Interview {
	id: string;
	round: string;
	interviewer: string | null;
	scheduledAt: string;
	mode: string | null;
	notes: string | null;
	createdAt: string;
}

export interface CreateInterviewRequest {
	round: string;
	interviewer?: string;
	scheduledAt: string;
	mode?: string;
	notes?: string;
}

export type UpdateInterviewRequest = Partial<CreateInterviewRequest>;

export interface Contact {
	id: string;
	name: string;
	role: string | null;
	email: string | null;
	createdAt: string;
}

export interface CreateContactRequest {
	name: string;
	role?: string;
	email?: string;
}

export type UpdateContactRequest = Partial<CreateContactRequest>;

export interface Page<T> {
	content: T[];
	totalElements: number;
	totalPages: number;
	number: number;
	size: number;
}
