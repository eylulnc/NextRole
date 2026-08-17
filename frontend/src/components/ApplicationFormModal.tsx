import { useState, type FormEvent } from "react";
import type { Application, CreateApplicationRequest } from "../types/application";
import { statusOptions } from "./StatusBadge";

const inputStyle: React.CSSProperties = {
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	padding: "10px 12px",
	font: "13px var(--font-body)",
	background: "var(--color-input-bg)",
	width: "100%",
};

const labelStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 6,
	fontSize: 12.5,
	fontWeight: 500,
	color: "oklch(38% 0.012 250)",
};

interface Props {
	initial?: Application;
	onSubmit: (request: CreateApplicationRequest) => Promise<void>;
	onClose: () => void;
}

export function ApplicationFormModal({ initial, onSubmit, onClose }: Props) {
	const [form, setForm] = useState<CreateApplicationRequest>({
		company: initial?.company ?? "",
		role: initial?.role ?? "",
		location: initial?.location ?? "",
		salaryMin: initial?.salaryMin ?? undefined,
		salaryMax: initial?.salaryMax ?? undefined,
		techStack: initial?.techStack ?? "",
		applicationDate: initial?.applicationDate ?? "",
		status: initial?.status ?? "SAVED",
		notes: initial?.notes ?? "",
	});
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			await onSubmit(form);
			onClose();
		} finally {
			setSubmitting(false);
		}
	}

	function update<K extends keyof CreateApplicationRequest>(key: K, value: CreateApplicationRequest[K]) {
		setForm((f) => ({ ...f, [key]: value }));
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			style={{
				position: "fixed",
				inset: 0,
				background: "oklch(22% 0.014 250 / 0.35)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				zIndex: 10,
			}}
			onClick={onClose}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "#fff",
					borderRadius: 16,
					padding: 28,
					width: "100%",
					maxWidth: 480,
					display: "flex",
					flexDirection: "column",
					gap: 16,
					maxHeight: "90vh",
					overflowY: "auto",
				}}
			>
				<h2 style={{ font: "700 18px var(--font-heading)", margin: 0 }}>
					{initial ? "Edit application" : "New application"}
				</h2>
				<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
					<label style={labelStyle}>
						Company
						<input
							required
							value={form.company}
							onChange={(e) => update("company", e.target.value)}
							style={inputStyle}
						/>
					</label>
					<label style={labelStyle}>
						Role
						<input required value={form.role} onChange={(e) => update("role", e.target.value)} style={inputStyle} />
					</label>
					<label style={labelStyle}>
						Location
						<input value={form.location ?? ""} onChange={(e) => update("location", e.target.value)} style={inputStyle} />
					</label>
					<div style={{ display: "flex", gap: 12 }}>
						<label style={{ ...labelStyle, flex: 1 }}>
							Salary min
							<input
								type="number"
								value={form.salaryMin ?? ""}
								onChange={(e) => update("salaryMin", e.target.value ? Number(e.target.value) : undefined)}
								style={inputStyle}
							/>
						</label>
						<label style={{ ...labelStyle, flex: 1 }}>
							Salary max
							<input
								type="number"
								value={form.salaryMax ?? ""}
								onChange={(e) => update("salaryMax", e.target.value ? Number(e.target.value) : undefined)}
								style={inputStyle}
							/>
						</label>
					</div>
					<label style={labelStyle}>
						Tech stack (comma-separated)
						<input value={form.techStack ?? ""} onChange={(e) => update("techStack", e.target.value)} style={inputStyle} />
					</label>
					<label style={labelStyle}>
						Application date
						<input
							type="date"
							value={form.applicationDate ?? ""}
							onChange={(e) => update("applicationDate", e.target.value)}
							style={inputStyle}
						/>
					</label>
					<label style={labelStyle}>
						Status
						<select value={form.status} onChange={(e) => update("status", e.target.value as CreateApplicationRequest["status"])} style={inputStyle}>
							{statusOptions().map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</label>
					<label style={labelStyle}>
						Notes
						<textarea
							value={form.notes ?? ""}
							onChange={(e) => update("notes", e.target.value)}
							style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
						/>
					</label>
					<div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
						<button
							type="button"
							onClick={onClose}
							style={{
								border: "1px solid var(--color-border)",
								background: "#fff",
								borderRadius: 10,
								padding: "10px 16px",
								font: "600 13px var(--font-body)",
								cursor: "pointer",
							}}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting}
							style={{
								border: "none",
								borderRadius: 10,
								padding: "10px 16px",
								background: "var(--color-accent)",
								color: "#fff",
								font: "600 13px var(--font-body)",
								cursor: submitting ? "default" : "pointer",
								opacity: submitting ? 0.7 : 1,
							}}
						>
							{initial ? "Save changes" : "Create application"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
