import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	changeApplicationStatus,
	createContact,
	createInterview,
	createNote,
	getApplication,
	getApplicationHistory,
	listContacts,
	listInterviews,
	listNotes,
	updateApplication,
} from "../api/applications";
import type {
	Application,
	ApplicationStatus,
	Contact,
	CreateApplicationRequest,
	Interview,
	Note,
	StatusHistoryEntry,
} from "../types/application";
import { AppShell } from "../components/AppShell";
import { StatusBadge, statusOptions } from "../components/StatusBadge";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { formatDate, formatDateTime } from "../utils/date";

type Tab = "overview" | "history" | "interviews" | "contacts" | "notes";

const cardStyle: React.CSSProperties = {
	background: "#fff",
	border: "1px solid var(--color-border)",
	borderRadius: 14,
	padding: 20,
};

const inputStyle: React.CSSProperties = {
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	padding: "9px 12px",
	font: "13px var(--font-body)",
	background: "var(--color-input-bg)",
};

const addButtonStyle: React.CSSProperties = {
	border: "none",
	borderRadius: 10,
	padding: "9px 16px",
	background: "var(--color-accent)",
	color: "#fff",
	font: "600 13px var(--font-body)",
	cursor: "pointer",
	alignSelf: "flex-start",
};

export function ApplicationDetailPage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [application, setApplication] = useState<Application | null>(null);
	const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
	const [notes, setNotes] = useState<Note[]>([]);
	const [interviews, setInterviews] = useState<Interview[]>([]);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [tab, setTab] = useState<Tab>("overview");
	const [editing, setEditing] = useState(false);
	const [changingStage, setChangingStage] = useState(false);
	const [showNoteForm, setShowNoteForm] = useState(false);
	const [showInterviewForm, setShowInterviewForm] = useState(false);
	const [showContactForm, setShowContactForm] = useState(false);

	async function refresh() {
		if (!id) return;
		const [app, hist, noteList, interviewList, contactList] = await Promise.all([
			getApplication(id),
			getApplicationHistory(id),
			listNotes(id),
			listInterviews(id),
			listContacts(id),
		]);
		setApplication(app);
		setHistory(hist);
		setNotes(noteList);
		setInterviews(interviewList);
		setContacts(contactList);
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

	async function handleAddNote(text: string) {
		if (!id) return;
		await createNote(id, { text });
		setShowNoteForm(false);
		await refresh();
	}

	async function handleAddInterview(round: string, interviewer: string, scheduledAt: string, mode: string, notesText: string) {
		if (!id) return;
		await createInterview(id, {
			round,
			interviewer: interviewer || undefined,
			scheduledAt: new Date(scheduledAt).toISOString(),
			mode: mode || undefined,
			notes: notesText || undefined,
		});
		setShowInterviewForm(false);
		await refresh();
	}

	async function handleAddContact(name: string, role: string, email: string) {
		if (!id) return;
		await createContact(id, { name, role: role || undefined, email: email || undefined });
		setShowContactForm(false);
		await refresh();
	}

	if (!application) {
		return (
			<AppShell>
				<p style={{ color: "var(--color-text-muted)" }}>{t("applications.loading")}</p>
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
					{t("applicationDetail.back")}
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
						{t("applicationDetail.edit")}
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
						{t("applicationDetail.changeStage")}
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

			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid var(--color-border)",
				}}
			>
				<div style={{ display: "flex", gap: 6 }}>
					{([
						["overview", t("applicationDetail.tabs.overview")],
						["history", t("applicationDetail.tabs.history")],
						["interviews", t("applicationDetail.tabs.interviews")],
						["contacts", t("applicationDetail.tabs.contacts")],
						["notes", t("applicationDetail.tabs.notes")],
					] as [Tab, string][]).map(([t2, label]) => (
						<div
							key={t2}
							onClick={() => setTab(t2)}
							style={{
								padding: "10px 16px",
								font: "600 13px var(--font-body)",
								cursor: "pointer",
								color: tab === t2 ? "var(--color-text)" : "var(--color-text-faint)",
								borderBottom: `2px solid ${tab === t2 ? "var(--color-accent)" : "transparent"}`,
							}}
						>
							{label}
						</div>
					))}
				</div>
				{tab === "interviews" && (
					<ToggleAddButton
						addLabel={t("applicationDetail.addInterview")}
						open={showInterviewForm}
						onToggle={() => setShowInterviewForm((v) => !v)}
					/>
				)}
				{tab === "contacts" && (
					<ToggleAddButton
						addLabel={t("applicationDetail.addContact")}
						open={showContactForm}
						onToggle={() => setShowContactForm((v) => !v)}
					/>
				)}
				{tab === "notes" && (
					<ToggleAddButton
						addLabel={t("applicationDetail.addNote")}
						open={showNoteForm}
						onToggle={() => setShowNoteForm((v) => !v)}
					/>
				)}
			</div>

			{tab === "overview" && (
				<div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
					<div style={cardStyle}>
						<h3 style={{ font: "700 15px var(--font-heading)", margin: "0 0 12px" }}>{t("applicationDetail.jobDescription")}</h3>
						<p style={{ fontSize: 13.5, lineHeight: 1.7, color: "oklch(30% 0.012 250)", whiteSpace: "pre-line" }}>
							{application.jobDescription || t("applicationDetail.noJobDescription")}
						</p>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<div style={cardStyle}>
							<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 10px" }}>{t("applicationDetail.techStack")}</h3>
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
						<div style={cardStyle}>
							<h3 style={{ font: "700 14px var(--font-heading)", margin: "0 0 8px" }}>{t("applicationDetail.keyDates")}</h3>
							<div style={{ fontSize: 13, color: "oklch(40% 0.012 250)", display: "flex", flexDirection: "column", gap: 6 }}>
								<div>
									{application.applicationDate
										? t("applicationDetail.applied", { date: formatDate(application.applicationDate) })
										: t("applicationDetail.notAppliedYet")}
								</div>
								<div>{t("applicationDetail.lastUpdated", { date: formatDate(application.updatedAt) })}</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{tab === "history" && (
				<div style={cardStyle}>
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
										{formatDateTime(h.changedAt)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{tab === "interviews" && (
				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{showInterviewForm && <InterviewForm onSubmit={handleAddInterview} />}
					{interviews.map((iv) => (
						<div key={iv.id} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 6 }}>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ fontWeight: 700, fontSize: 14 }}>{iv.round}</span>
								<span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
									{formatDateTime(iv.scheduledAt)}
								</span>
							</div>
							{(iv.interviewer || iv.mode) && (
								<div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
									{[iv.interviewer, iv.mode].filter(Boolean).join(" · ")}
								</div>
							)}
							{iv.notes && <div style={{ fontSize: 13, color: "oklch(35% 0.012 250)", marginTop: 4 }}>{iv.notes}</div>}
						</div>
					))}
					{interviews.length === 0 && <p style={{ color: "var(--color-text-muted)" }}>{t("applicationDetail.noInterviews")}</p>}
				</div>
			)}

			{tab === "contacts" && (
				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{showContactForm && <ContactForm onSubmit={handleAddContact} />}
					<div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
						{contacts.map((c) => (
							<div key={c.id} style={{ ...cardStyle, display: "flex", gap: 12, alignItems: "center" }}>
								<div
									style={{
										width: 40,
										height: 40,
										borderRadius: "50%",
										background: "oklch(93% 0.03 35)",
										flex: "none",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										font: "700 14px var(--font-heading)",
										color: "oklch(45% 0.11 35)",
									}}
								>
									{c.name.charAt(0).toUpperCase()}
								</div>
								<div style={{ minWidth: 0 }}>
									<div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
									{c.role && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{c.role}</div>}
									{c.email && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{c.email}</div>}
								</div>
							</div>
						))}
					</div>
					{contacts.length === 0 && <p style={{ color: "var(--color-text-muted)" }}>{t("applicationDetail.noContacts")}</p>}
				</div>
			)}

			{tab === "notes" && (
				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					{showNoteForm && <NoteForm onSubmit={handleAddNote} />}
					{notes.map((n) => (
						<div key={n.id} style={{ ...cardStyle, padding: "16px 18px" }}>
							<div style={{ fontSize: 11.5, color: "var(--color-text-faint)", marginBottom: 6 }}>
								{formatDateTime(n.createdAt)}
							</div>
							<div style={{ fontSize: 13.5, color: "oklch(30% 0.012 250)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
								{n.text}
							</div>
						</div>
					))}
					{notes.length === 0 && <p style={{ color: "var(--color-text-muted)" }}>{t("applicationDetail.noNotes")}</p>}
				</div>
			)}

			{editing && <ApplicationFormModal initial={application} onSubmit={handleUpdate} onClose={() => setEditing(false)} />}
		</AppShell>
	);
}

function NoteForm({ onSubmit }: { onSubmit: (text: string) => Promise<void> }) {
	const { t } = useTranslation();
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!text.trim()) return;
		setSubmitting(true);
		try {
			await onSubmit(text);
			setText("");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={t("applicationDetail.noteForm.placeholder")}
				style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
			/>
			<button type="submit" disabled={submitting} style={addButtonStyle}>
				{t("applicationDetail.noteForm.submit")}
			</button>
		</form>
	);
}

function ToggleAddButton({ addLabel, open, onToggle }: { addLabel: string; open: boolean; onToggle: () => void }) {
	const { t } = useTranslation();
	return (
		<button
			onClick={onToggle}
			style={{
				border: open ? "1px solid var(--color-border)" : "none",
				background: open ? "#fff" : "var(--color-accent)",
				color: open ? "var(--color-text)" : "#fff",
				borderRadius: 10,
				padding: "9px 16px",
				font: "600 13px var(--font-body)",
				cursor: "pointer",
			}}
		>
			{open ? t("applicationDetail.cancel") : addLabel}
		</button>
	);
}

function InterviewForm({
	onSubmit,
}: {
	onSubmit: (round: string, interviewer: string, scheduledAt: string, mode: string, notes: string) => Promise<void>;
}) {
	const { t } = useTranslation();
	const [round, setRound] = useState("");
	const [interviewer, setInterviewer] = useState("");
	const [scheduledAt, setScheduledAt] = useState("");
	const [mode, setMode] = useState("");
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!round.trim() || !scheduledAt) return;
		setSubmitting(true);
		try {
			await onSubmit(round, interviewer, scheduledAt, mode, notes);
			setRound("");
			setInterviewer("");
			setScheduledAt("");
			setMode("");
			setNotes("");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
				<input
					required
					placeholder={t("applicationDetail.interviewForm.roundPlaceholder")}
					value={round}
					onChange={(e) => setRound(e.target.value)}
					style={inputStyle}
				/>
				<input
					placeholder={t("applicationDetail.interviewForm.interviewerPlaceholder")}
					value={interviewer}
					onChange={(e) => setInterviewer(e.target.value)}
					style={inputStyle}
				/>
				<input
					required
					type="datetime-local"
					value={scheduledAt}
					onChange={(e) => setScheduledAt(e.target.value)}
					style={inputStyle}
				/>
				<input
					placeholder={t("applicationDetail.interviewForm.modePlaceholder")}
					value={mode}
					onChange={(e) => setMode(e.target.value)}
					style={inputStyle}
				/>
			</div>
			<input
				placeholder={t("applicationDetail.interviewForm.notesPlaceholder")}
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				style={inputStyle}
			/>
			<button type="submit" disabled={submitting} style={addButtonStyle}>
				{t("applicationDetail.interviewForm.submit")}
			</button>
		</form>
	);
}

function ContactForm({ onSubmit }: { onSubmit: (name: string, role: string, email: string) => Promise<void> }) {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		try {
			await onSubmit(name, role, email);
			setName("");
			setRole("");
			setEmail("");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
				<input
					required
					placeholder={t("applicationDetail.contactForm.namePlaceholder")}
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={inputStyle}
				/>
				<input
					placeholder={t("applicationDetail.contactForm.rolePlaceholder")}
					value={role}
					onChange={(e) => setRole(e.target.value)}
					style={inputStyle}
				/>
				<input
					placeholder={t("applicationDetail.contactForm.emailPlaceholder")}
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					style={inputStyle}
				/>
			</div>
			<button type="submit" disabled={submitting} style={addButtonStyle}>
				{t("applicationDetail.contactForm.submit")}
			</button>
		</form>
	);
}
