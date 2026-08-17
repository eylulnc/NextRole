import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createApplication, deleteApplication, listApplications, updateApplication } from "../api/applications";
import type { Application, CreateApplicationRequest } from "../types/application";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { IconButton, PencilIcon, TrashIcon } from "../components/IconButton";
import { formatDate } from "../utils/date";

export function ApplicationsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [applications, setApplications] = useState<Application[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [editing, setEditing] = useState<Application | null>(null);
	const [creating, setCreating] = useState(false);

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
		await createApplication(request);
		await refresh();
	}

	async function handleUpdate(id: string, request: CreateApplicationRequest) {
		await updateApplication(id, request);
		await refresh();
	}

	async function handleDelete(id: string) {
		if (!window.confirm(t("applications.confirmDelete"))) return;
		await deleteApplication(id);
		await refresh();
	}

	return (
		<AppShell>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
				<h1 style={{ font: "700 26px var(--font-heading)", margin: 0 }}>{t("applications.title")}</h1>
				<button
					onClick={() => setCreating(true)}
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

			{loading ? (
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.loading")}</p>
			) : filtered.length === 0 ? (
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.empty")}</p>
			) : (
				<div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, overflowX: "auto" }}>
					<div style={{ minWidth: 880 }}>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1.6fr 1.4fr 1fr 1.6fr 1fr 1fr 84px",
							padding: "12px 20px",
							fontSize: 11.5,
							fontWeight: 600,
							color: "var(--color-text-faint)",
							textTransform: "uppercase",
							letterSpacing: "0.03em",
							borderBottom: "1px solid var(--color-border)",
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
							<div style={{ color: "oklch(40% 0.012 250)" }}>{app.location ?? "—"}</div>
							<div style={{ color: "oklch(40% 0.012 250)" }}>
								{app.salaryMin && app.salaryMax ? `€${app.salaryMin / 1000}k–${app.salaryMax / 1000}k` : "—"}
							</div>
							<div style={{ display: "flex", gap: 5, flexWrap: "nowrap", overflow: "hidden" }}>
								{(() => {
									const tags = (app.techStack ?? "")
										.split(",")
										.map((t) => t.trim())
										.filter(Boolean);
									const MAX_VISIBLE = 3;
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
							<div
								onClick={(e) => e.stopPropagation()}
								style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
							>
								<IconButton onClick={() => setEditing(app)} label={t("applications.editAria", { company: app.company })}>
									<PencilIcon />
								</IconButton>
								<IconButton
									onClick={() => handleDelete(app.id)}
									label={t("applications.deleteAria", { company: app.company })}
									variant="danger"
								>
									<TrashIcon />
								</IconButton>
							</div>
						</div>
					))}
					</div>
				</div>
			)}

			{creating && (
				<ApplicationFormModal onSubmit={handleCreate} onClose={() => setCreating(false)} />
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
