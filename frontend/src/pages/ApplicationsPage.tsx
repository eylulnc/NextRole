import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	changeApplicationStatus,
	createApplication,
	deleteApplication,
	listApplications,
	updateApplication,
} from "../api/applications";
import type { Application, ApplicationStatus, CreateApplicationRequest } from "../types/application";
import { AppShell } from "../components/AppShell";
import { StatusBadge, statusOptions } from "../components/StatusBadge";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { useConfirm } from "../components/ConfirmDialog";
import { KebabMenu } from "../components/KebabMenu";
import { FilterIcon } from "../components/IconButton";
import { ApplicationBoard } from "../components/ApplicationBoard";
import { useToast } from "../context/ToastContext";
import { usePipelineStages } from "../context/PipelineStagesContext";
import { PipelineStagesModal } from "../components/PipelineStagesModal";
import { GearIcon } from "../components/IconButton";
import { formatDate } from "../utils/date";
import { formatSalaryRange } from "../utils/currency";
import { formatLocation } from "../utils/workMode";

type View = "table" | "board";
type SortColumn = "company" | "salary" | "applied";
type SortDirection = "asc" | "desc";

function compareNullable<T>(a: T | null | undefined, b: T | null | undefined, cmp: (a: T, b: T) => number): number {
	const aNull = a === null || a === undefined || a === "";
	const bNull = b === null || b === undefined || b === "";
	if (aNull && bNull) return 0;
	if (aNull) return 1;
	if (bNull) return -1;
	return cmp(a, b);
}

function SortableHeader({
	column,
	label,
	sortColumn,
	sortDirection,
	onSort,
}: {
	column: SortColumn;
	label: string;
	sortColumn: SortColumn;
	sortDirection: SortDirection;
	onSort: (column: SortColumn) => void;
}) {
	const active = sortColumn === column;
	return (
		<div
			onClick={() => onSort(column)}
			data-testid={`sort-header-${column}`}
			style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}
		>
			{label}
			{active && <span style={{ color: "var(--color-text)", fontSize: 10 }}>{sortDirection === "asc" ? "▲" : "▼"}</span>}
		</div>
	);
}

const VIEW_KEY = "nextrole_applications_view";

function isView(value: string | null): value is View {
	return value === "table" || value === "board";
}

const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"] as const;

const filterInputStyle: React.CSSProperties = {
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	padding: "9px 14px",
	font: "13px var(--font-body)",
	background: "var(--color-surface)",
	color: "var(--color-text)",
};

const filterSelectStyle: React.CSSProperties = {
	...filterInputStyle,
	appearance: "none",
	WebkitAppearance: "none",
	MozAppearance: "none",
	backgroundImage:
		"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23767468' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5l5 5 5-5'/%3E%3C/svg%3E\")",
	backgroundRepeat: "no-repeat",
	backgroundPosition: "right 12px center",
	backgroundSize: "14px",
	paddingRight: 34,
	cursor: "pointer",
};

export function ApplicationsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { visibleStages } = usePipelineStages();
	const [managingStages, setManagingStages] = useState(false);
	const { confirm, dialog: confirmDialog } = useConfirm();
	const [applications, setApplications] = useState<Application[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [view, setView] = useState<View>(() => {
		const stored = localStorage.getItem(VIEW_KEY);
		return isView(stored) ? stored : "table";
	});
	const [editing, setEditing] = useState<Application | null>(null);
	const [creating, setCreating] = useState(false);
	const [creatingStatus, setCreatingStatus] = useState<ApplicationStatus | undefined>(undefined);
	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
	const [workModeFilter, setWorkModeFilter] = useState("");
	const [techStackFilter, setTechStackFilter] = useState("");
	const [locationFilter, setLocationFilter] = useState("");
	const [dateFromFilter, setDateFromFilter] = useState("");
	const [dateToFilter, setDateToFilter] = useState("");
	const [minSalaryFilter, setMinSalaryFilter] = useState("");
	const [maxSalaryFilter, setMaxSalaryFilter] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const filtersRef = useRef<HTMLDivElement>(null);
	const [sortColumn, setSortColumn] = useState<SortColumn>("applied");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	function toggleSort(column: SortColumn) {
		if (sortColumn !== column) {
			setSortColumn(column);
			setSortDirection("asc");
			return;
		}
		setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
	}

	useEffect(() => {
		if (!filtersOpen) return;
		function handleOutsideClick(e: MouseEvent) {
			if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
				setFiltersOpen(false);
			}
		}
		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape") setFiltersOpen(false);
		}
		document.addEventListener("mousedown", handleOutsideClick);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [filtersOpen]);

	async function refresh() {
		setLoading(true);
		try {
			const page = await listApplications();
			setApplications(page.content);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		refresh();
	}, []);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		const techQuery = techStackFilter.trim().toLowerCase();
		const locationQuery = locationFilter.trim().toLowerCase();
		const minSalary = minSalaryFilter.trim() ? Number(minSalaryFilter) : null;
		const maxSalary = maxSalaryFilter.trim() ? Number(maxSalaryFilter) : null;
		return applications.filter((a) => {
			if (query && !(a.company.toLowerCase().includes(query) || a.role.toLowerCase().includes(query))) return false;
			if (statusFilter && a.status !== statusFilter) return false;
			if (workModeFilter && a.workMode !== workModeFilter) return false;
			if (techQuery && !(a.techStack ?? "").toLowerCase().includes(techQuery)) return false;
			if (locationQuery && !(a.location ?? "").toLowerCase().includes(locationQuery)) return false;
			if (dateFromFilter && (!a.applicationDate || a.applicationDate < dateFromFilter)) return false;
			if (dateToFilter && (!a.applicationDate || a.applicationDate > dateToFilter)) return false;
			if (minSalary !== null) {
				const salary = a.salaryMin ?? a.salaryMax;
				if (salary === null || salary < minSalary) return false;
			}
			if (maxSalary !== null) {
				const salary = a.salaryMax ?? a.salaryMin;
				if (salary === null || salary > maxSalary) return false;
			}
			return true;
		});
	}, [
		applications,
		search,
		statusFilter,
		workModeFilter,
		techStackFilter,
		locationFilter,
		dateFromFilter,
		dateToFilter,
		minSalaryFilter,
		maxSalaryFilter,
	]);

	const sorted = useMemo(() => {
		const dir = sortDirection === "asc" ? 1 : -1;
		const list = [...filtered];
		list.sort((a, b) => {
			switch (sortColumn) {
				case "company":
					return dir * (a.company.localeCompare(b.company) || a.role.localeCompare(b.role));
				case "salary":
					return (
						dir *
						(compareNullable(a.salaryMin, b.salaryMin, (x, y) => x - y) ||
							compareNullable(a.salaryMax, b.salaryMax, (x, y) => x - y))
					);
				case "applied":
					// No applied date is treated as the oldest possible date, not sorted to the end.
					// Ties (e.g. several apps with no date) break by company name for a deterministic order.
					return (
						dir *
						((a.applicationDate ?? "").localeCompare(b.applicationDate ?? "") || a.company.localeCompare(b.company))
					);
			}
		});
		return list;
	}, [filtered, sortColumn, sortDirection]);

	const activeFilterCount = [
		statusFilter,
		workModeFilter,
		techStackFilter,
		locationFilter,
		dateFromFilter,
		dateToFilter,
		minSalaryFilter,
		maxSalaryFilter,
	].filter((v) => v !== "").length;

	function clearFilters() {
		setSearch("");
		setStatusFilter("");
		setWorkModeFilter("");
		setTechStackFilter("");
		setLocationFilter("");
		setDateFromFilter("");
		setDateToFilter("");
		setMinSalaryFilter("");
		setMaxSalaryFilter("");
	}

	async function handleCreate(request: CreateApplicationRequest) {
		try {
			await createApplication(request);
			showToast(t("applications.toasts.created"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleUpdate(id: string, request: CreateApplicationRequest) {
		try {
			await updateApplication(id, request);
			showToast(t("applications.toasts.updated"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleDelete(id: string) {
		if (!(await confirm(t("applications.confirmDelete")))) return;
		try {
			await deleteApplication(id);
			showToast(t("applications.toasts.deleted"), "success");
			await refresh();
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	async function handleBoardStatusChange(id: string, status: ApplicationStatus) {
		try {
			await changeApplicationStatus(id, status);
			showToast(t("applications.toasts.statusChanged"), "success");
			await refresh();
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	function handleAddToStatus(status: ApplicationStatus) {
		setCreatingStatus(status);
		setCreating(true);
	}

	return (
		<AppShell>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
				<h1 style={{ font: "700 26px var(--font-heading)", margin: 0 }}>{t("applications.title")}</h1>
				<button
					onClick={() => {
						setCreatingStatus(undefined);
						setCreating(true);
					}}
					style={{
						border: "none",
						borderRadius: 10,
						padding: "11px 18px",
						background: "var(--color-accent)",
						color: "var(--color-on-accent)",
						font: "600 13px var(--font-body)",
						cursor: "pointer",
					}}
				>
					{t("applications.newApplication")}
				</button>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
				<div style={{ display: "flex", background: "var(--color-border)", borderRadius: 10, padding: 3 }}>
					{(["board", "table"] as View[]).map((v) => (
						<div
							key={v}
							onClick={() => {
								setView(v);
								localStorage.setItem(VIEW_KEY, v);
							}}
							style={{
								padding: "7px 16px",
								borderRadius: 8,
								font: "600 13px var(--font-body)",
								cursor: "pointer",
								background: view === v ? "var(--color-surface)" : "transparent",
								color: view === v ? "var(--color-text)" : "var(--color-text-faint)",
							}}
						>
							{v === "board" ? t("applications.boardView") : t("applications.tableView")}
						</div>
					))}
				</div>
				<button
					type="button"
					onClick={() => setManagingStages(true)}
					aria-label={t("pipelineStages.manage")}
					title={t("pipelineStages.manage")}
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: 36,
						height: 36,
						border: "1px solid var(--color-border)",
						borderRadius: 10,
						background: "var(--color-surface)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
					}}
				>
					<GearIcon />
				</button>
				<input
					type="text"
					placeholder={t("applications.searchPlaceholder")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{ ...filterInputStyle, width: 190 }}
				/>
				{view === "table" && (
					<div ref={filtersRef} style={{ position: "relative" }}>
						<button
							type="button"
							onClick={() => setFiltersOpen((v) => !v)}
							aria-haspopup="dialog"
							aria-expanded={filtersOpen}
							style={{
								...filterInputStyle,
								display: "inline-flex",
								alignItems: "center",
								gap: 7,
								cursor: "pointer",
							}}
						>
							<FilterIcon />
							{t("applications.filters.button")}
							{activeFilterCount > 0 && (
								<span
									style={{
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										minWidth: 18,
										height: 18,
										padding: "0 5px",
										borderRadius: 9,
										background: "var(--color-accent)",
										color: "var(--color-on-accent)",
										fontSize: 11,
										fontWeight: 700,
									}}
								>
									{activeFilterCount}
								</span>
							)}
						</button>
						{filtersOpen && (
							<div
								role="dialog"
								onClick={(e) => e.stopPropagation()}
								style={{
									position: "absolute",
									top: "calc(100% + 8px)",
									left: 0,
									background: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: 12,
									boxShadow: "0 12px 32px var(--color-shadow-md)",
									padding: 16,
									zIndex: 5,
									minWidth: 380,
								}}
							>
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
									<select
										value={statusFilter}
										onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "")}
										style={filterSelectStyle}
									>
										<option value="">{t("applications.filters.allStatuses")}</option>
										{statusOptions(visibleStages).map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
									<select
										value={workModeFilter}
										onChange={(e) => setWorkModeFilter(e.target.value)}
										style={filterSelectStyle}
									>
										<option value="">{t("applications.filters.allWorkModes")}</option>
										{WORK_MODES.map((mode) => (
											<option key={mode} value={mode}>
												{t(`applicationForm.workModeOptions.${mode}`)}
											</option>
										))}
									</select>
									<input
										type="text"
										placeholder={t("applications.filters.techStackPlaceholder")}
										value={techStackFilter}
										onChange={(e) => setTechStackFilter(e.target.value)}
										style={filterInputStyle}
									/>
									<input
										type="text"
										placeholder={t("applications.filters.locationPlaceholder")}
										value={locationFilter}
										onChange={(e) => setLocationFilter(e.target.value)}
										style={filterInputStyle}
									/>
									<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
										<span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{t("applications.filters.dateFrom")}</span>
										<input
											type="date"
											value={dateFromFilter}
											onChange={(e) => setDateFromFilter(e.target.value)}
											style={filterInputStyle}
										/>
									</label>
									<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
										<span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{t("applications.filters.dateTo")}</span>
										<input
											type="date"
											value={dateToFilter}
											onChange={(e) => setDateToFilter(e.target.value)}
											style={filterInputStyle}
										/>
									</label>
									<input
										type="number"
										placeholder={t("applications.filters.minSalaryPlaceholder")}
										value={minSalaryFilter}
										onChange={(e) => setMinSalaryFilter(e.target.value)}
										style={filterInputStyle}
									/>
									<input
										type="number"
										placeholder={t("applications.filters.maxSalaryPlaceholder")}
										value={maxSalaryFilter}
										onChange={(e) => setMaxSalaryFilter(e.target.value)}
										style={filterInputStyle}
									/>
								</div>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault();
											clearFilters();
										}}
									>
										{t("applications.filters.clearAll")}
									</a>
									<button
										type="button"
										onClick={() => setFiltersOpen(false)}
										style={{
											border: "none",
											borderRadius: 10,
											padding: "8px 16px",
											background: "var(--color-accent)",
											color: "var(--color-on-accent)",
											font: "600 13px var(--font-body)",
											cursor: "pointer",
										}}
									>
										{t("applications.filters.done")}
									</button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{loading ? (
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.loading")}</p>
			) : applications.length === 0 ? (
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.empty")}</p>
			) : filtered.length === 0 ? (
				<p style={{ color: "var(--color-text-muted)" }}>
					{t("applications.emptySearch")}{" "}
					<a href="#" onClick={(e) => { e.preventDefault(); clearFilters(); }}>
						{t("applications.clearSearch")}
					</a>
				</p>
			) : view === "board" ? (
				<ApplicationBoard
					applications={filtered}
					onStatusChange={handleBoardStatusChange}
					onAddToStatus={handleAddToStatus}
					onEdit={setEditing}
					onDelete={handleDelete}
				/>
			) : (
				<div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, overflowX: "auto" }}>
					<div style={{ minWidth: 920 }}>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1.6fr 1.4fr 1fr 1.6fr 1fr 1fr 84px",
							columnGap: 16,
							padding: "12px 20px",
							fontSize: 11.5,
							fontWeight: 600,
							color: "var(--color-text-faint)",
							textTransform: "uppercase",
							letterSpacing: "0.03em",
							borderBottom: "1px solid var(--color-border)",
							position: "sticky",
							top: 0,
							background: "var(--color-surface)",
							zIndex: 1,
						}}
					>
						<SortableHeader column="company" label={t("applications.columns.companyRole")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
						<div>{t("applications.columns.location")}</div>
						<SortableHeader column="salary" label={t("applications.columns.salary")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
						<div>{t("applications.columns.techStack")}</div>
						<div>{t("applications.columns.status")}</div>
						<SortableHeader column="applied" label={t("applications.columns.applied")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
						<div />
					</div>
					{sorted.map((app) => (
						<div
							key={app.id}
							onClick={() => navigate(`/applications/${app.id}`)}
							style={{
								display: "grid",
								gridTemplateColumns: "1.6fr 1.4fr 1fr 1.6fr 1fr 1fr 84px",
								columnGap: 16,
								padding: "14px 20px",
								alignItems: "center",
								borderBottom: "1px solid var(--color-border)",
								fontSize: 13,
								cursor: "pointer",
							}}
						>
							<div>
								<div style={{ fontWeight: 600 }}>{app.company}</div>
								<div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{app.role}</div>
							</div>
							<div style={{ color: "var(--color-text-muted)" }}>{formatLocation(app.location, app.workMode) ?? "—"}</div>
							<div style={{ color: "var(--color-text-muted)" }}>
								{formatSalaryRange(app.salaryMin, app.salaryMax, app.currency) ?? "—"}
							</div>
							<div style={{ display: "flex", gap: 5, flexWrap: "nowrap", overflow: "hidden" }}>
								{(() => {
									const tags = (app.techStack ?? "")
										.split(",")
										.map((t) => t.trim())
										.filter(Boolean);
									const MAX_VISIBLE = 2;
									const visible = tags.slice(0, MAX_VISIBLE);
									const hiddenCount = tags.length - visible.length;
									return (
										<>
											{visible.map((t) => (
												<span
													key={t}
													style={{
														font: "500 10px var(--font-mono)",
														background: "var(--color-sidebar-bg)",
														padding: "3px 6px",
														borderRadius: 5,
														color: "var(--color-text-muted)",
														whiteSpace: "nowrap",
													}}
												>
													{t}
												</span>
											))}
											{hiddenCount > 0 && (
												<span
													style={{
														font: "500 10px var(--font-mono)",
														padding: "3px 6px",
														color: "var(--color-text-faint)",
														whiteSpace: "nowrap",
													}}
												>
													+{hiddenCount}
												</span>
											)}
										</>
									);
								})()}
							</div>
							<div>
								<StatusBadge status={app.status} />
							</div>
							<div style={{ color: "var(--color-text-muted)" }}>
							{app.applicationDate ? formatDate(app.applicationDate) : "—"}
						</div>
							<div onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
								<KebabMenu
									ariaLabel={t("applications.actionsAria", { company: app.company })}
									items={[
										{ label: t("common.edit"), onClick: () => setEditing(app) },
										{ label: t("common.delete"), onClick: () => handleDelete(app.id), variant: "danger" },
									]}
								/>
							</div>
						</div>
					))}
					</div>
				</div>
			)}

			{creating && (
				<ApplicationFormModal
					initialStatus={creatingStatus}
					onSubmit={handleCreate}
					onClose={() => {
						setCreating(false);
						setCreatingStatus(undefined);
					}}
				/>
			)}
			{editing && (
				<ApplicationFormModal
					initial={editing}
					onSubmit={(request) => handleUpdate(editing.id, request)}
					onClose={() => setEditing(null)}
				/>
			)}
			{confirmDialog}
			{managingStages && <PipelineStagesModal onClose={() => setManagingStages(false)} />}
		</AppShell>
	);
}
