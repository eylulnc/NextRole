import { apiClient } from "./client";

export type PipelineStageCategory = "PRE_RESPONSE" | "ACTIVE" | "TERMINAL";

export interface PipelineStage {
	id: string;
	key: string;
	label: string;
	orderIndex: number;
	hue: number;
	category: PipelineStageCategory;
	isBuiltIn: boolean;
	visible: boolean;
	applicationCount: number;
}

export interface CreatePipelineStageRequest {
	label: string;
	hue?: number;
	category?: PipelineStageCategory;
}

export interface UpdatePipelineStageRequest {
	label?: string;
	hue?: number;
	category?: PipelineStageCategory;
	visible?: boolean;
}

export async function listPipelineStages(): Promise<PipelineStage[]> {
	const response = await apiClient.get<PipelineStage[]>("/api/pipeline-stages");
	return response.data;
}

export async function createPipelineStage(request: CreatePipelineStageRequest): Promise<PipelineStage> {
	const response = await apiClient.post<PipelineStage>("/api/pipeline-stages", request);
	return response.data;
}

export async function updatePipelineStage(id: string, request: UpdatePipelineStageRequest): Promise<PipelineStage> {
	const response = await apiClient.patch<PipelineStage>(`/api/pipeline-stages/${id}`, request);
	return response.data;
}

export async function deletePipelineStage(id: string): Promise<void> {
	await apiClient.delete(`/api/pipeline-stages/${id}`);
}

export async function reorderPipelineStages(orderedIds: string[]): Promise<PipelineStage[]> {
	const response = await apiClient.patch<PipelineStage[]>("/api/pipeline-stages/reorder", { orderedIds });
	return response.data;
}

export async function reassignPipelineStage(id: string, toStageId: string): Promise<{ movedCount: number }> {
	const response = await apiClient.post<{ movedCount: number }>(`/api/pipeline-stages/${id}/reassign`, { toStageId });
	return response.data;
}
