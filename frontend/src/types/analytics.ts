import type { ApplicationStatus } from "./application";
import type { FunnelStageCount } from "./dashboard";

export interface MonthlyApplicationCount {
	month: string;
	count: number;
}

export interface TechnologyCount {
	technology: string;
	count: number;
}

export interface StageConversionRate {
	status: ApplicationStatus;
	conversionRatePercent: number;
}

export interface Analytics {
	funnelStages: FunnelStageCount[];
	applicationsOverTime: MonthlyApplicationCount[];
	topTechnologies: TechnologyCount[];
	stageConversionRates: StageConversionRate[];
}
