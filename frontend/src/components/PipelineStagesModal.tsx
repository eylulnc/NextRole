import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import {
	createPipelineStage,
	deletePipelineStage,
	reassignPipelineStage,
	reorderPipelineStages,
	updatePipelineStage,
	type PipelineStage,
	type PipelineStageCategory,
} from "../api/pipelineStages";
import { usePipelineStages } from "../context/PipelineStagesContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "./ConfirmDialog";
import { CloseButton } from "./CloseButton";
import { ChevronDownIcon, CheckIcon, DragHandleIcon, EyeIcon, EyeOffIcon, TrashIcon } from "./IconButton";

const CATEGORIES: PipelineStageCategory[] = ["PRE_RESPONSE", "ACTIVE", "TERMINAL"];

const DEFAULT_STAGE_KEY_ORDER = ["SAVED", "APPLIED", "HR_INTERVIEW", "TECHNICAL", "FINAL", "OFFER", "REJECTED"];

const MAX_PIPELINE_STAGES = 12;

const inputStyle: React.CSSProperties = {
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	padding: "8px 12px",
	font: "13px var(--font-body)",
	background: "var(--color-input-bg)",
	color: "var(--color-text)",
};

const iconButtonStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: 26,
	height: 26,
	border: "none",
	background: "transparent",
	borderRadius: 6,
	cursor: "pointer",
	color: "var(--color-text-muted)",
};

function sortForDisplay(list: PipelineStage[]): PipelineStage[] {
	return [...list].sort((a, b) => {
		if (a.visible !== b.visible) return a.visible ? -1 : 1;
		return a.orderIndex - b.orderIndex;
	});
}

function isDuplicateLabel(stages: PipelineStage[], label: string, excludeId?: string): boolean {
	const normalized = label.trim().toLowerCase();
	return stages.some((s) => s.id !== excludeId && s.label.trim().toLowerCase() === normalized);
}

function CategoryDropdown({ value, onChange }: { value: PipelineStageCategory; onChange: (category: PipelineStageCategory) => void }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handleOutsideClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
		}
		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", handleOutsideClick);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	return (
		<div ref={containerRef} style={{ position: "relative", width: 150 }}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				style={{
					...inputStyle,
					width: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 6,
					cursor: "pointer",
				}}
			>
				<span style={{ fontSize: 12 }}>{t(`pipelineStages.categories.${value}`)}</span>
				<span style={{ color: "var(--color-text-faint)", flex: "none" }}>
					<ChevronDownIcon />
				</span>
			</button>
			{open && (
				<div
					role="listbox"
					style={{
						position: "absolute",
						top: "calc(100% + 4px)",
						left: 0,
						right: 0,
						background: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						borderRadius: 10,
						boxShadow: "0 12px 32px var(--color-shadow-md)",
						padding: 4,
						zIndex: 6,
					}}
				>
					{CATEGORIES.map((category) => (
						<div
							key={category}
							role="option"
							aria-selected={category === value}
							onClick={() => {
								onChange(category);
								setOpen(false);
							}}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								padding: "7px 8px",
								borderRadius: 6,
								cursor: "pointer",
								fontSize: 12,
								color: "var(--color-text)",
							}}
						>
							<span style={{ width: 12, height: 12, display: "inline-flex", flex: "none", color: "var(--color-accent)" }}>
								{category === value && <CheckIcon />}
							</span>
							<span>{t(`pipelineStages.categories.${category}`)}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function StagePicker({
	options,
	value,
	onChange,
}: {
	options: PipelineStage[];
	value: string | null;
	onChange: (id: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const selected = options.find((o) => o.id === value);

	useEffect(() => {
		if (!open) return;
		function handleOutsideClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, [open]);

	return (
		<div ref={containerRef} style={{ position: "relative" }}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				style={{
					...inputStyle,
					width: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 6,
					cursor: "pointer",
				}}
			>
				<span style={{ display: "flex", alignItems: "center", gap: 8 }}>
					{selected && <span style={{ width: 10, height: 10, borderRadius: "50%", background: `oklch(60% 0.13 ${selected.hue})` }} />}
					<span>{selected?.label ?? ""}</span>
				</span>
				<ChevronDownIcon />
			</button>
			{open && (
				<div
					role="listbox"
					style={{
						position: "absolute",
						top: "calc(100% + 4px)",
						left: 0,
						right: 0,
						background: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						borderRadius: 10,
						boxShadow: "0 12px 32px var(--color-shadow-md)",
						padding: 4,
						zIndex: 12,
						maxHeight: 200,
						overflowY: "auto",
					}}
				>
					{options.map((option) => (
						<div
							key={option.id}
							role="option"
							aria-selected={option.id === value}
							onClick={() => {
								onChange(option.id);
								setOpen(false);
							}}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
								padding: "7px 8px",
								borderRadius: 6,
								cursor: "pointer",
								fontSize: 13,
								color: "var(--color-text)",
							}}
						>
							<span style={{ width: 10, height: 10, borderRadius: "50%", background: `oklch(60% 0.13 ${option.hue})`, flex: "none" }} />
							<span>{option.label}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

interface ReassignTarget {
	stage: PipelineStage;
	action: "hide" | "delete";
}

function ReassignDialog({
	target,
	otherVisibleStages,
	onCancel,
	onConfirm,
	submitting,
}: {
	target: ReassignTarget;
	otherVisibleStages: PipelineStage[];
	onCancel: () => void;
	onConfirm: (toStageId: string) => void;
	submitting: boolean;
}) {
	const { t } = useTranslation();
	const [toStageId, setToStageId] = useState<string | null>(otherVisibleStages[0]?.id ?? null);

	return (
		<div
			role="dialog"
			aria-modal="true"
			onClick={(e) => e.stopPropagation()}
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--color-overlay-backdrop)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				zIndex: 20,
			}}
		>
			<div
				style={{
					background: "var(--color-surface)",
					borderRadius: 16,
					padding: 28,
					width: "100%",
					maxWidth: 420,
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<h3 style={{ font: "700 16px var(--font-heading)", margin: 0 }}>
					{t("pipelineStages.reassign.title", { count: target.stage.applicationCount, label: target.stage.label })}
				</h3>
				{otherVisibleStages.length === 0 ? (
					<p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>{t("pipelineStages.reassign.noTarget")}</p>
				) : (
					<>
						<p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>{t("pipelineStages.reassign.description")}</p>
						<StagePicker options={otherVisibleStages} value={toStageId} onChange={setToStageId} />
					</>
				)}
				<div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
					<button
						type="button"
						onClick={onCancel}
						style={{
							border: "1px solid var(--color-border)",
							borderRadius: 10,
							padding: "9px 16px",
							background: "var(--color-surface)",
							color: "var(--color-text)",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
						}}
					>
						{t("common.cancel")}
					</button>
					{otherVisibleStages.length > 0 && (
						<button
							type="button"
							disabled={!toStageId || submitting}
							onClick={() => toStageId && onConfirm(toStageId)}
							style={{
								border: "none",
								borderRadius: 10,
								padding: "9px 16px",
								background: "var(--color-accent)",
								color: "var(--color-on-accent)",
								font: "600 13px var(--font-body)",
								cursor: submitting ? "default" : "pointer",
								opacity: submitting ? 0.7 : 1,
							}}
						>
							{t(
								target.action === "hide"
									? "pipelineStages.reassign.moveAndHideCta"
									: "pipelineStages.reassign.moveAndDeleteCta",
								{ count: target.stage.applicationCount }
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export function PipelineStagesModal({ onClose }: { onClose: () => void }) {
	const { t } = useTranslation();
	const { stages, refresh } = usePipelineStages();
	const { showToast } = useToast();
	const { confirm, dialog: confirmDialog } = useConfirm();

	const [newLabel, setNewLabel] = useState("");
	const [addError, setAddError] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingLabel, setEditingLabel] = useState("");
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dragOverId, setDragOverId] = useState<string | null>(null);
	const [reassignTarget, setReassignTarget] = useState<ReassignTarget | null>(null);
	const [reassigning, setReassigning] = useState(false);

	const panelRef = useRef<HTMLDivElement>(null);
	const stageCount = useRef(stages.length);
	useEffect(() => {
		if (stages.length > stageCount.current && panelRef.current) {
			const panel = panelRef.current;
			if (typeof panel.scrollTo === "function") {
				panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
			} else {
				panel.scrollTop = panel.scrollHeight;
			}
		}
		stageCount.current = stages.length;
	}, [stages.length]);

	function errorMessage(error: unknown): string {
		if (isAxiosError(error) && typeof error.response?.data?.error === "string") {
			return error.response.data.error;
		}
		return t("pipelineStages.toasts.error");
	}

	async function toggleVisible(stage: PipelineStage) {
		if (stage.visible && stage.applicationCount > 0) {
			setReassignTarget({ stage, action: "hide" });
			return;
		}
		try {
			await updatePipelineStage(stage.id, { visible: !stage.visible });
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		}
	}

	async function handleDrop(targetId: string) {
		const sourceId = draggingId;
		setDraggingId(null);
		setDragOverId(null);
		if (!sourceId || sourceId === targetId) return;
		const list = sortForDisplay(stages);
		const ids = list.map((s) => s.id);
		const from = ids.indexOf(sourceId);
		const to = ids.indexOf(targetId);
		ids.splice(from, 1);
		ids.splice(to, 0, sourceId);
		try {
			await reorderPipelineStages(ids);
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		}
	}

	async function resetOrder() {
		const current = sortForDisplay(stages).sort((a, b) => a.orderIndex - b.orderIndex);
		const builtIn = current
			.filter((s) => s.isBuiltIn)
			.sort((a, b) => DEFAULT_STAGE_KEY_ORDER.indexOf(a.key) - DEFAULT_STAGE_KEY_ORDER.indexOf(b.key));
		const custom = current.filter((s) => !s.isBuiltIn);
		const ids = [...builtIn, ...custom].map((s) => s.id);
		try {
			await reorderPipelineStages(ids);
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		}
	}

	async function saveLabel(stage: PipelineStage) {
		const trimmed = editingLabel.trim();
		setEditingId(null);
		if (!trimmed || trimmed === stage.label) return;
		if (isDuplicateLabel(stages, trimmed, stage.id)) {
			showToast(t("pipelineStages.duplicateName", { label: trimmed }), "error");
			return;
		}
		try {
			await updatePipelineStage(stage.id, { label: trimmed });
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		}
	}

	async function changeCategory(stage: PipelineStage, category: PipelineStageCategory) {
		try {
			await updatePipelineStage(stage.id, { category });
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		}
	}

	async function handleDeleteClick(stage: PipelineStage) {
		if (stage.applicationCount > 0) {
			setReassignTarget({ stage, action: "delete" });
			return;
		}
		if (!(await confirm(t("pipelineStages.confirmDelete", { label: stage.label })))) return;
		try {
			await deletePipelineStage(stage.id);
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		}
	}

	async function handleReassignConfirm(toStageId: string) {
		if (!reassignTarget) return;
		const { stage, action } = reassignTarget;
		setReassigning(true);
		try {
			const { movedCount } = await reassignPipelineStage(stage.id, toStageId);
			if (action === "hide") {
				await updatePipelineStage(stage.id, { visible: false });
			} else {
				await deletePipelineStage(stage.id);
			}
			showToast(t("pipelineStages.reassign.toastMoved", { count: movedCount }), "success");
			setReassignTarget(null);
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		} finally {
			setReassigning(false);
		}
	}

	async function handleAdd(e: FormEvent) {
		e.preventDefault();
		const trimmed = newLabel.trim();
		if (!trimmed) return;
		if (stages.length >= MAX_PIPELINE_STAGES) {
			setAddError(t("pipelineStages.limitReached", { max: MAX_PIPELINE_STAGES }));
			return;
		}
		if (isDuplicateLabel(stages, trimmed)) {
			setAddError(t("pipelineStages.duplicateName", { label: trimmed }));
			return;
		}
		try {
			await createPipelineStage({ label: trimmed });
			setNewLabel("");
			setAddError(null);
			await refresh();
		} catch (error) {
			showToast(errorMessage(error), "error");
		}
	}

	const limitReached = stages.length >= MAX_PIPELINE_STAGES;
	const displayStages = sortForDisplay(stages);
	const currentOrderIds = [...stages].sort((a, b) => a.orderIndex - b.orderIndex).map((s) => s.id);
	const defaultOrderIds = [...stages]
		.sort((a, b) => {
			if (a.isBuiltIn !== b.isBuiltIn) return a.isBuiltIn ? -1 : 1;
			if (a.isBuiltIn) return DEFAULT_STAGE_KEY_ORDER.indexOf(a.key) - DEFAULT_STAGE_KEY_ORDER.indexOf(b.key);
			return a.orderIndex - b.orderIndex;
		})
		.map((s) => s.id);
	const orderChanged = currentOrderIds.join(",") !== defaultOrderIds.join(",");

	return (
		<div
			role="dialog"
			aria-modal="true"
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--color-overlay-backdrop)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				zIndex: 10,
			}}
		>
			<div
				ref={panelRef}
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--color-surface)",
					borderRadius: 16,
					padding: 32,
					width: "100%",
					maxWidth: 560,
					maxHeight: "85vh",
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					gap: 16,
					position: "relative",
				}}
			>
				<CloseButton onClick={onClose} />
				<div>
					<h2 style={{ font: "700 18px var(--font-heading)", margin: 0 }}>{t("pipelineStages.title")}</h2>
					<p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>{t("pipelineStages.subtitle")}</p>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					{displayStages.map((stage) => (
						<div
							key={stage.id}
							draggable
							onDragStart={(e: DragEvent<HTMLDivElement>) => {
								e.dataTransfer.effectAllowed = "move";
								setDraggingId(stage.id);
							}}
							onDragOver={(e: DragEvent<HTMLDivElement>) => {
								e.preventDefault();
								if (draggingId && draggingId !== stage.id) setDragOverId(stage.id);
							}}
							onDragLeave={() => setDragOverId((id) => (id === stage.id ? null : id))}
							onDrop={(e: DragEvent<HTMLDivElement>) => {
								e.preventDefault();
								handleDrop(stage.id);
							}}
							onDragEnd={() => {
								setDraggingId(null);
								setDragOverId(null);
							}}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 10,
								padding: "8px 10px",
								borderRadius: 10,
								border: dragOverId === stage.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
								background: dragOverId === stage.id ? "var(--color-drag-over)" : "transparent",
								opacity: draggingId === stage.id ? 0.4 : stage.visible ? 1 : 0.55,
								transition: "background 0.1s ease, border-color 0.1s ease",
							}}
						>
							<div style={{ ...iconButtonStyle, cursor: "grab", color: "var(--color-text-faint)" }}>
								<DragHandleIcon />
							</div>

							<div style={{ width: 12, height: 12, borderRadius: "50%", background: `oklch(60% 0.13 ${stage.hue})`, flex: "none" }} />

							{editingId === stage.id ? (
								<input
									autoFocus
									value={editingLabel}
									onChange={(e) => setEditingLabel(e.target.value)}
									onBlur={() => saveLabel(stage)}
									onKeyDown={(e) => {
										if (e.key === "Enter") saveLabel(stage);
										if (e.key === "Escape") setEditingId(null);
									}}
									style={{ ...inputStyle, flex: 1 }}
								/>
							) : (
								<span
									onClick={() => {
										setEditingId(stage.id);
										setEditingLabel(stage.label);
									}}
									style={{ flex: 1, fontSize: 13.5, fontWeight: 600, cursor: "text" }}
								>
									{stage.label}
								</span>
							)}

							<CategoryDropdown value={stage.category} onChange={(category) => changeCategory(stage, category)} />

							<button
								type="button"
								onClick={() => toggleVisible(stage)}
								aria-label={stage.visible ? t("pipelineStages.hide") : t("pipelineStages.show")}
								title={stage.visible ? t("pipelineStages.hide") : t("pipelineStages.show")}
								style={iconButtonStyle}
							>
								{stage.visible ? <EyeIcon /> : <EyeOffIcon />}
							</button>

							<div style={{ width: 26, flex: "none" }}>
								{!stage.isBuiltIn && (
									<button
										type="button"
										onClick={() => handleDeleteClick(stage)}
										aria-label={t("common.delete")}
										title={t("common.delete")}
										style={iconButtonStyle}
									>
										<TrashIcon />
									</button>
								)}
							</div>
						</div>
					))}
				</div>

				<form
					onSubmit={handleAdd}
					style={{ display: "flex", flexDirection: "column", gap: 6 }}
				>
					<div style={{ display: "flex", gap: 10 }}>
						<input
							type="text"
							placeholder={t("pipelineStages.addPlaceholder")}
							value={newLabel}
							disabled={limitReached}
							onChange={(e) => {
								setNewLabel(e.target.value);
								if (addError) setAddError(null);
							}}
							style={{
								...inputStyle,
								flex: 1,
								borderColor: addError ? "var(--color-danger)" : "var(--color-border)",
								opacity: limitReached ? 0.5 : 1,
							}}
						/>
						<button
							type="submit"
							disabled={!newLabel.trim() || limitReached}
							style={{
								border: "1px solid var(--color-border)",
								borderRadius: 10,
								padding: "8px 16px",
								background: "var(--color-surface)",
								color: "var(--color-text)",
								font: "600 13px var(--font-body)",
								cursor: newLabel.trim() && !limitReached ? "pointer" : "default",
								opacity: newLabel.trim() && !limitReached ? 1 : 0.5,
							}}
						>
							{t("pipelineStages.addCta")}
						</button>
					</div>
					{limitReached && (
						<span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
							{t("pipelineStages.limitReached", { max: MAX_PIPELINE_STAGES })}
						</span>
					)}
					{!limitReached && addError && <span style={{ fontSize: 12, color: "var(--color-danger)" }}>{addError}</span>}
				</form>

				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<button
						type="button"
						onClick={resetOrder}
						disabled={!orderChanged}
						style={{
							border: "none",
							background: "transparent",
							color: "var(--color-text-muted)",
							font: "600 12.5px var(--font-body)",
							cursor: orderChanged ? "pointer" : "default",
							opacity: orderChanged ? 1 : 0.5,
							padding: "4px 2px",
						}}
					>
						{t("pipelineStages.resetOrderCta")}
					</button>
				</div>
			</div>
			{confirmDialog}
			{reassignTarget && (
				<ReassignDialog
					target={reassignTarget}
					otherVisibleStages={stages.filter((s) => s.visible && s.id !== reassignTarget.stage.id)}
					onCancel={() => setReassignTarget(null)}
					onConfirm={handleReassignConfirm}
					submitting={reassigning}
				/>
			)}
		</div>
	);
}
