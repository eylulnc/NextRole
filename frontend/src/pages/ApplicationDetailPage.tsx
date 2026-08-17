import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	changeApplicationStatus,
	getApplication,
	getApplicationHistory,
	updateApplication,
} from "../api/applications";
import type { Application, ApplicationStatus, CreateApplicationRequest, StatusHistoryEntry } from "../types/application";
import { AppShell } from "../components/AppShell";
import { StatusBadge, statusOptions } from "../components/StatusBadge";
import { ApplicationFormModal } from "../components/ApplicationFormModal";

type Tab = "overview" | "history";

export function ApplicationDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [application, setApplication] = useState<Application | null>(null);
	const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
	const [tab, setTab] = useState<Tab>("overview");
	const [editing, setEditing] = useState(false);
	const [changingStage, setChangingStage] = useState(false);

	async function refresh() {
		if (!id) return;
		const [app, hist] = await Promise.all([getApplication(id), getApplicationHistory(id)]);
		setApplication(app);
		setHistory(hist);
	}

	useEffect(() => {
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	async function handleUpdate(request: CreateApplicationRequest) {
		if (!id) return;
		await updateApplication(id, request);
		await refresh();
	}

	async function handleChangeStatus(status: ApplicationStatus) {
		if (!id) return;
		await changeApplicationStatus(id, status);
		setChangingStage(false);
		await refresh();
	}

	if (!application) {
		return (
			<AppShell>
				<p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
			</AppShell>
		);
	}

	return (
		<AppShell>
			<div>
				<a
					href="#"
					onClick={(e) => {
						e.preventDefault();
						navigate("/applications");
					}}
					style={{ fontSize: 13, textDecoration: "none", fontWeight: 600 }}
				>
					← Back to applications
				</a>
			</div>

			<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
						<h1 style={{ font: "700 26px var(--font-heading)", margin: 0 }}>{application.role}</h1>
						<StatusBadge status={application.status} />
					</div>
					<div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
						{application.company}
						{application.location ? ` · ${application.location}` : ""}
						{application.salaryMin && application.salaryMax
							? ` · €${application.salaryMin / 1000}k–${application.salaryMax / 1000}k`
							: ""}
					</div>
				</div>
				<div style={{ display: "flex", gap: 10, position: "relative" }}>
					<button
						onClick={() => setEditing(true)}
						style={{
							border: "1px solid var(--color-border)",
							background: "#fff",
							borderRadius: 10,
							padding: "10px 16px",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
						}}
					>
						Edit
					</button>
					<button
						onClick={() => setChangingStage((v) => !v)}
						style={{
							border: "none",
							background: "var(--color-accent)",
							color: "#fff",
							borderRadius: 10,
							padding: "10px 16px",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
						}}
					>
						Change stage
					</button>
					{changingStage && (
						<div
							style={{
								position: "absolute",
								top: "calc(100% + 8px)",
								right: 0,
								background: "#fff",
								border: "1px solid var(--color-border)",
								borderRadius: 12,
								boxShadow: "0 12px 32px oklch(22% 0.014 250 / 0.12)",
								padding: 8,
								display: "flex",
								flexDirection: "column",
								gap: 2,
								zIndex: 5,
								minWidth: 160,
							}}
						>
							{statusOptions().map((opt) => (
								<button
									key={opt.value}
									onClick={() => handleChangeStatus(opt.value)}
									style={{
										border: "none",
										background: opt.value === application.status ? "oklch(96% 0.006 250)" : "transparent",
										borderRadius: 8,
										padding: "8px 10px",
										font: "500 13px var(--font-body)",
										textAlign: "left",
										cursor: "pointer",
									}}
								>
									{opt.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--color-border)" }}>
				{(["overview", "history"] as Tab[]).map((t) => (
					<div
						key={t}
						onClick={() => setTab(t)}
						style={{
							padding: "10px 16px",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
							color: tab === t ? "var(--color-text)" : "var(--color-text-faint)",
							borderBottom: `2px solid ${tab === t ? "var(--color-accent)" : "transparent"}`,
						}}
					>
						{t === "overview" ? "Overview" : "Status History"}
					</div>
				))}
			</div>

			{tab === "overview" && (
				<div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
					<div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, padding: 22 }}>
						<h3 style={{ font: "700 15px var(--font-heading)", margin: "0 0 12px" }}>Job description</h3>
						<p style={{ fontSize: 13.5, lineHeight: 1.7, color: "oklch(30% 0.012 250)", whiteSpace: "pre-line" }}>
							{application.jobDescription || "No job description saved yet."}
						</p>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, padding: 20 }}>
							<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 10px" }}>Tech stack</h3>
							<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
								{(application.techStack ?? "")
									.split(",")
									.map((t) => t.trim())
									.filter(Boolean)
									.map((t) => (
										<span
											key={t}
											style={{
												font: "500 11px var(--font-mono)",
												background: "oklch(95% 0.006 250)",
												padding: "4px 9px",
												borderRadius: 6,
											}}
										>
											{t}
										</span>
									))}
							</div>
						</div>
						<div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, padding: 20 }}>
							<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 8px" }}>Key dates</h3>
							<div style={{ fontSize: 13, color: "oklch(40% 0.012 250)", display: "flex", flexDirection: "column", gap: 6 }}>
								<div>Applied: {application.applicationDate ?? "Not applied yet"}</div>
								<div>Last updated: {new Date(application.updatedAt).toLocaleDateString()}</div>
							</div>
						</div>
						{application.notes && (
							<div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, padding: 20 }}>
								<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 8px" }}>Notes</h3>
								<p style={{ fontSize: 13, color: "oklch(35% 0.012 250)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
									{application.notes}
								</p>
							</div>
						)}
					</div>
				</div>
			)}

			{tab === "history" && (
				<div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, padding: 24 }}>
					<div style={{ display: "flex", flexDirection: "column" }}>
						{history.map((h, i) => (
							<div key={h.id} style={{ display: "flex", gap: 16 }}>
								<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
									<div
										style={{
											width: 10,
											height: 10,
											borderRadius: "50%",
											background: i === history.length - 1 ? "var(--color-accent)" : "oklch(80% 0.02 250)",
											flex: "none",
										}}
									/>
									{i < history.length - 1 && <div style={{ width: 1, flex: 1, background: "oklch(91% 0.007 250)" }} />}
								</div>
								<div style={{ paddingBottom: 22 }}>
									<div style={{ fontWeight: 600, fontSize: 13.5 }}>
										<StatusBadge status={h.status} />
									</div>
									<div style={{ fontSize: 12, color: "var(--color-text-faint)", marginTop: 4 }}>
										{new Date(h.changedAt).toLocaleString()}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{editing && <ApplicationFormModal initial={application} onSubmit={handleUpdate} onClose={() => setEditing(false)} />}
		</AppShell>
	);
}
