import type { ApplicationStatus } from "./application";

export interface FunnelStageCount {
	status: ApplicationStatus;
	count: number;
}

export interface UpcomingInterview {
	applicationId: string;
	company: string;
	role: string;
	round: string;
	scheduledAt: string;
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
