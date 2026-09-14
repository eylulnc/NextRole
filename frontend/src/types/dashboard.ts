import type { ApplicationStatus } from "./application";

export interface FunnelStageCount {
	status: ApplicationStatus;
	count: number;
}

export interface InterviewConflict {
	id: string;
	applicationId: string;
	company: string;
	scheduledAt: string;
	durationMinutes: number | null;
}

export interface UpcomingInterview {
	id: string;
	applicationId: string;
	company: string;
	role: string;
	round: string;
	scheduledAt: string;
	mode: string | null;
	durationMinutes: number | null;
	meetingLink: string | null;
	conflictsWith: InterviewConflict | null;
}

export interface RecentActivity {
	applicationId: string;
	company: string;
	status: ApplicationStatus;
	changedAt: string;
}

export interface DashboardStatistics {
	activeApplications: number;
	applicationsAddedThisMonth: number;
	interviewsThisWeek: number;
	responseRatePercent: number;
	avgDaysInPipeline: number;
	funnelStages: FunnelStageCount[];
	upcomingInterviews: UpcomingInterview[];
	recentActivity: RecentActivity[];
}
