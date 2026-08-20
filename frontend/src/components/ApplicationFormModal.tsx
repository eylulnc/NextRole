import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Application, ApplicationStatus, CreateApplicationRequest } from "../types/application";
import { statusOptions } from "./StatusBadge";
import { CURRENCY_OPTIONS } from "../utils/currency";
import { CloseButton } from "./CloseButton";

const inputStyle: React.CSSProperties = {
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	padding: "10px 12px",
	font: "13px var(--font-body)",
	background: "var(--color-input-bg)",
	width: "100%",
};

const selectStyle: React.CSSProperties = {
	...inputStyle,
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

const labelStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 6,
	fontSize: 12.5,
	fontWeight: 500,
	color: "oklch(38% 0.012 250)",
};

const fieldRowStyle: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
	gap: 14,
};

interface Props {
	initial?: Application;
	initialStatus?: ApplicationStatus;
	onSubmit: (request: CreateApplicationRequest) => Promise<void>;
	onClose: () => void;
	onDelete?: () => void;
}

export function ApplicationFormModal({ initial, initialStatus, onSubmit, onClose, onDelete }: Props) {
	const { t } = useTranslation();
	const [form, setForm] = useState<CreateApplicationRequest>({
		company: initial?.company ?? "",
		role: initial?.role ?? "",
		location: initial?.location ?? "",
		workMode: initial?.workMode ?? undefined,
		salaryMin: initial?.salaryMin ?? undefined,
		salaryMax: initial?.salaryMax ?? undefined,
		currency: initial?.currency ?? "EUR",
		techStack: initial?.techStack ?? "",
		applicationDate: initial?.applicationDate ?? "",
		status: initial?.status ?? initialStatus ?? "SAVED",
		jobDescription: initial?.jobDescription ?? "",
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
					padding: 32,
					width: "100%",
					maxWidth: 720,
					display: "flex",
					flexDirection: "column",
					gap: 16,
					maxHeight: "90vh",
					overflowY: "auto",
					position: "relative",
				}}
			>
				<CloseButton onClick={onClose} />
				<h2 style={{ font: "700 18px var(--font-heading)", margin: 0 }}>
					{initial ? t("applicationForm.editTitle") : t("applicationForm.newTitle")}
				</h2>
				<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					<div style={fieldRowStyle}>
						<label style={labelStyle}>
							{t("applicationForm.company")}
							<input
								required
								value={form.company}
								onChange={(e) => update("company", e.target.value)}
								style={inputStyle}
							/>
						</label>
						<label style={labelStyle}>
							{t("applicationForm.role")}
							<input required value={form.role} onChange={(e) => update("role", e.target.value)} style={inputStyle} />
						</label>
					</div>
					<div style={fieldRowStyle}>
						<label style={labelStyle}>
							{t("applicationForm.location")}
							<input value={form.location ?? ""} onChange={(e) => update("location", e.target.value)} style={inputStyle} />
						</label>
						<label style={labelStyle}>
							{t("applicationForm.workMode")}
							<select value={form.workMode ?? ""} onChange={(e) => update("workMode", e.target.value || undefined)} style={selectStyle}>
								<option value="">{t("applicationForm.workModeOptions.none")}</option>
								<option value="REMOTE">{t("applicationForm.workModeOptions.REMOTE")}</option>
								<option value="HYBRID">{t("applicationForm.workModeOptions.HYBRID")}</option>
								<option value="ONSITE">{t("applicationForm.workModeOptions.ONSITE")}</option>
							</select>
						</label>
					</div>
					<div style={fieldRowStyle}>
						<label style={labelStyle}>
							{t("applicationForm.currency")}
							<select value={form.currency} onChange={(e) => update("currency", e.target.value)} style={selectStyle}>
								{CURRENCY_OPTIONS.map((code) => (
									<option key={code} value={code}>
										{code}
									</option>
								))}
							</select>
						</label>
						<label style={labelStyle}>
							{t("applicationForm.techStack")}
							<input value={form.techStack ?? ""} onChange={(e) => update("techStack", e.target.value)} style={inputStyle} />
						</label>
					</div>
					<div style={fieldRowStyle}>
						<label style={labelStyle}>
							{t("applicationForm.salaryMin")}
							<input
								type="number"
								value={form.salaryMin ?? ""}
								onChange={(e) => update("salaryMin", e.target.value ? Number(e.target.value) : undefined)}
								style={inputStyle}
							/>
						</label>
						<label style={labelStyle}>
							{t("applicationForm.salaryMax")}
							<input
								type="number"
								value={form.salaryMax ?? ""}
								onChange={(e) => update("salaryMax", e.target.value ? Number(e.target.value) : undefined)}
								style={inputStyle}
							/>
						</label>
					</div>
					<div style={fieldRowStyle}>
						{form.status !== "SAVED" && (
							<label style={labelStyle}>
								{t("applicationForm.applicationDate")}
								<input
									type="date"
									value={form.applicationDate ?? ""}
									onChange={(e) => update("applicationDate", e.target.value)}
									style={inputStyle}
								/>
							</label>
						)}
						<label style={labelStyle}>
							{t("applicationForm.status")}
							<select
								value={form.status}
								onChange={(e) => {
									const status = e.target.value as CreateApplicationRequest["status"];
									update("status", status);
									if (status === "SAVED") update("applicationDate", "");
								}}
								style={selectStyle}
							>
								{statusOptions().map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</label>
					</div>
					<label style={labelStyle}>
						{t("applicationForm.jobDescription")}
						<textarea
							value={form.jobDescription ?? ""}
							onChange={(e) => update("jobDescription", e.target.value)}
							style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
						/>
					</label>
					<div style={{ display: "flex", gap: 10, justifyContent: onDelete ? "space-between" : "flex-end", marginTop: 6 }}>
						{onDelete && (
							<button
								type="button"
								onClick={onDelete}
								style={{
									border: "1px solid oklch(50% 0.15 30)",
									borderRadius: 10,
									padding: "10px 16px",
									background: "#fff",
									color: "oklch(50% 0.15 30)",
									font: "600 13px var(--font-body)",
									cursor: "pointer",
								}}
							>
								{t("applicationForm.deleteCta")}
							</button>
						)}
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
							{initial ? t("applicationForm.saveCta") : t("applicationForm.createCta")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
