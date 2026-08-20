import { useEffect, useMemo, useState } from "react";
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
import { StatusBadge } from "../components/StatusBadge";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { KebabMenu } from "../components/KebabMenu";
import { ApplicationBoard } from "../components/ApplicationBoard";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/date";
import { formatSalaryRange } from "../utils/currency";
import { formatLocation } from "../utils/workMode";

type View = "table" | "board";

const VIEW_KEY = "nextrole_applications_view";

function isView(value: string | null): value is View {
	return value === "table" || value === "board";
}

export function ApplicationsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { showToast } = useToast();
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
		if (!query) return applications;
		return applications.filter(
			(a) => a.company.toLowerCase().includes(query) || a.role.toLowerCase().includes(query)
		);
	}, [applications, search]);

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
		if (!window.confirm(t("applications.confirmDelete"))) return;
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
						color: "#fff",
						font: "600 13px var(--font-body)",
						cursor: "pointer",
					}}
				>
					{t("applications.newApplication")}
				</button>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
				<div style={{ display: "flex", background: "oklch(94% 0.006 250)", borderRadius: 10, padding: 3 }}>
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
								background: view === v ? "#fff" : "transparent",
								color: view === v ? "var(--color-text)" : "var(--color-text-faint)",
							}}
						>
							{v === "board" ? t("applications.boardView") : t("applications.tableView")}
						</div>
					))}
				</div>
				<input
					type="text"
					placeholder={t("applications.searchPlaceholder")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{
						border: "1px solid var(--color-border)",
						borderRadius: 10,
						padding: "9px 14px",
						font: "13px var(--font-body)",
						minWidth: 260,
						background: "#fff",
					}}
				/>
			</div>

			{loading ? (
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.loading")}</p>
			) : filtered.length === 0 ? (
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.empty")}</p>
			) : view === "board" ? (
				<ApplicationBoard
					applications={filtered}
					onStatusChange={handleBoardStatusChange}
					onAddToStatus={handleAddToStatus}
					onEdit={setEditing}
					onDelete={handleDelete}
				/>
			) : (
				<div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, overflowX: "auto" }}>
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
							background: "#fff",
							zIndex: 1,
						}}
					>
						<div>{t("applications.columns.companyRole")}</div>
						<div>{t("applications.columns.location")}</div>
						<div>{t("applications.columns.salary")}</div>
						<div>{t("applications.columns.techStack")}</div>
						<div>{t("applications.columns.status")}</div>
						<div>{t("applications.columns.applied")}</div>
						<div />
					</div>
					{filtered.map((app) => (
						<div
							key={app.id}
							onClick={() => navigate(`/applications/${app.id}`)}
							style={{
								display: "grid",
								gridTemplateColumns: "1.6fr 1.4fr 1fr 1.6fr 1fr 1fr 84px",
								columnGap: 16,
								padding: "14px 20px",
								alignItems: "center",
								borderBottom: "1px solid oklch(95% 0.005 250)",
								fontSize: 13,
								cursor: "pointer",
							}}
						>
							<div>
								<div style={{ fontWeight: 600 }}>{app.company}</div>
								<div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{app.role}</div>
							</div>
							<div style={{ color: "oklch(40% 0.012 250)" }}>{formatLocation(app.location, app.workMode) ?? "—"}</div>
							<div style={{ color: "oklch(40% 0.012 250)" }}>
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
														background: "oklch(95% 0.006 250)",
														padding: "3px 6px",
														borderRadius: 5,
														color: "oklch(38% 0.012 250)",
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
		</AppShell>
	);
}
