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
	salaryMin: number | null;
	salaryMax: number | null;
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
	salaryMin?: number;
	salaryMax?: number;
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

export interface Page<T> {
	content: T[];
	totalElements: number;
	totalPages: number;
	number: number;
	size: number;
}
