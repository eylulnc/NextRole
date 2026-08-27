import type { PipelineStage } from "../api/pipelineStages";

export const SAMPLE_STAGES: PipelineStage[] = [
	{ id: "stage-saved", key: "SAVED", label: "Saved", orderIndex: 0, hue: 230, category: "PRE_RESPONSE", isBuiltIn: true, visible: true, applicationCount: 0 },
	{ id: "stage-applied", key: "APPLIED", label: "Applied", orderIndex: 1, hue: 200, category: "PRE_RESPONSE", isBuiltIn: true, visible: true, applicationCount: 0 },
	{ id: "stage-hr", key: "HR_INTERVIEW", label: "HR Interview", orderIndex: 2, hue: 280, category: "ACTIVE", isBuiltIn: true, visible: true, applicationCount: 0 },
	{ id: "stage-technical", key: "TECHNICAL", label: "Technical", orderIndex: 3, hue: 310, category: "ACTIVE", isBuiltIn: true, visible: true, applicationCount: 0 },
	{ id: "stage-final", key: "FINAL", label: "Final Round", orderIndex: 4, hue: 20, category: "ACTIVE", isBuiltIn: true, visible: true, applicationCount: 0 },
	{ id: "stage-offer", key: "OFFER", label: "Offer", orderIndex: 5, hue: 150, category: "TERMINAL", isBuiltIn: true, visible: true, applicationCount: 0 },
	{ id: "stage-rejected", key: "REJECTED", label: "Rejected", orderIndex: 6, hue: 0, category: "TERMINAL", isBuiltIn: true, visible: true, applicationCount: 0 },
];
