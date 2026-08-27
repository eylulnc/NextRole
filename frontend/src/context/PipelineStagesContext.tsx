import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as pipelineStagesApi from "../api/pipelineStages";
import type { PipelineStage } from "../api/pipelineStages";
import { useAuth } from "./AuthContext";

interface PipelineStagesContextValue {
	stages: PipelineStage[];
	visibleStages: PipelineStage[];
	loading: boolean;
	refresh: () => Promise<PipelineStage[]>;
}

const PipelineStagesContext = createContext<PipelineStagesContextValue | undefined>(undefined);

export function PipelineStagesProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated } = useAuth();
	const [stages, setStages] = useState<PipelineStage[]>([]);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		if (!isAuthenticated) {
			setStages([]);
			return [];
		}
		setLoading(true);
		try {
			const result = await pipelineStagesApi.listPipelineStages();
			setStages(result);
			return result;
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const visibleStages = stages.filter((s) => s.visible);

	return (
		<PipelineStagesContext.Provider value={{ stages, visibleStages, loading, refresh }}>
			{children}
		</PipelineStagesContext.Provider>
	);
}

export function usePipelineStages(): PipelineStagesContextValue {
	const context = useContext(PipelineStagesContext);
	if (!context) {
		throw new Error("usePipelineStages must be used within a PipelineStagesProvider");
	}
	return context;
}
