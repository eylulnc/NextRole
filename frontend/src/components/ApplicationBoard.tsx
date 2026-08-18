import { useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Application, ApplicationStatus } from "../types/application";
import { statusHue, statusOptions } from "./StatusBadge";
import { formatSalaryRange } from "../utils/currency";
import { formatLocation } from "../utils/workMode";
import { PlusIcon } from "./IconButton";

const cardStyle: React.CSSProperties = {
	background: "#fff",
	border: "1px solid var(--color-border)",
	borderRadius: 12,
	padding: 14,
	cursor: "grab",
	display: "flex",
	flexDirection: "column",
	gap: 8,
};

interface Props {
	applications: Application[];
	onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
	onAddToStatus: (status: ApplicationStatus) => void;
}

export function ApplicationBoard({ applications, onStatusChange, onAddToStatus }: Props) {
	const navigate = useNavigate();
	const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(null);

	const columns = statusOptions().map((opt) => ({
		status: opt.value as ApplicationStatus,
		label: opt.label,
		cards: applications.filter((a) => a.status === opt.value),
	}));

	function handleDragStart(e: DragEvent<HTMLDivElement>, applicationId: string) {
		e.dataTransfer.setData("text/plain", applicationId);
		e.dataTransfer.effectAllowed = "move";
	}

	function handleDrop(e: DragEvent<HTMLDivElement>, status: ApplicationStatus) {
		e.preventDefault();
		setDragOverStatus(null);
		const applicationId = e.dataTransfer.getData("text/plain");
		if (applicationId) onStatusChange(applicationId, status);
	}

	return (
		<div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 24, width: "100%", minWidth: 0 }}>
			{columns.map((col) => (
				<div
					key={col.status}
					data-testid={`board-column-${col.status}`}
					onDragOver={(e) => {
						e.preventDefault();
						setDragOverStatus(col.status);
					}}
					onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
					onDrop={(e) => handleDrop(e, col.status)}
					style={{
						width: 250,
						minHeight: 260,
						flex: "none",
						display: "flex",
						flexDirection: "column",
						gap: 12,
						borderRadius: 12,
						background: dragOverStatus === col.status ? "oklch(95% 0.02 60)" : "transparent",
						padding: dragOverStatus === col.status ? 6 : 0,
						transition: "background 0.1s ease",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<div
								style={{
									width: 8,
									height: 8,
									borderRadius: 2,
									background: `oklch(60% 0.13 ${statusHue(col.status)})`,
									flex: "none",
								}}
							/>
							<span style={{ font: "600 13px var(--font-body)" }}>{col.label}</span>
							<span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{col.cards.length}</span>
						</div>
						{col.cards.length > 0 && (
							<button
								onClick={() => onAddToStatus(col.status)}
								aria-label={`Add application to ${col.label}`}
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: 24,
									height: 24,
									border: "none",
									background: "transparent",
									color: "var(--color-text-faint)",
									cursor: "pointer",
									borderRadius: 6,
								}}
							>
								<PlusIcon />
							</button>
						)}
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						{col.cards.map((app) => (
							<div
								key={app.id}
								draggable
								onDragStart={(e) => handleDragStart(e, app.id)}
								onClick={() => navigate(`/applications/${app.id}`)}
								style={cardStyle}
							>
								<div>
									<div style={{ fontWeight: 600, fontSize: 13.5 }}>{app.company}</div>
									<div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>{app.role}</div>
								</div>
								<div style={{ fontSize: 11.5, color: "var(--color-text-faint)" }}>
									{[formatLocation(app.location, app.workMode), formatSalaryRange(app.salaryMin, app.salaryMax, app.currency)]
										.filter(Boolean)
										.join(" · ") || "—"}
								</div>
								{app.techStack && (
									<div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
										{app.techStack
											.split(",")
											.map((tag) => tag.trim())
											.filter(Boolean)
											.slice(0, 3)
											.map((tag) => (
												<span
													key={tag}
													style={{
														font: "500 10.5px var(--font-mono)",
														background: "oklch(95% 0.006 250)",
														padding: "3px 7px",
														borderRadius: 6,
														color: "oklch(38% 0.012 250)",
													}}
												>
													{tag}
												</span>
											))}
									</div>
								)}
							</div>
						))}
						{col.cards.length === 0 && (
							<button
								onClick={() => onAddToStatus(col.status)}
								style={{
									border: "1px dashed var(--color-border)",
									borderRadius: 12,
									padding: "18px 14px",
									background: "transparent",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<span
									style={{
										width: 28,
										height: 28,
										borderRadius: "50%",
										background: "var(--color-accent)",
										color: "#fff",
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<PlusIcon />
								</span>
							</button>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
