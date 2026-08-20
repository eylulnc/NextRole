import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	changeApplicationStatus,
	createContact,
	createInterview,
	createNote,
	deleteApplication,
	deleteContact,
	deleteInterview,
	deleteNote,
	getApplication,
	getApplicationHistory,
	listContacts,
	listInterviews,
	listNotes,
	updateApplication,
	updateContact,
	updateInterview,
	updateNote,
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
import { CloseButton } from "../components/CloseButton";
import { PlusIcon } from "../components/IconButton";
import { KebabMenu } from "../components/KebabMenu";
import { useToast } from "../context/ToastContext";
import { formatDate, formatDateTime } from "../utils/date";
import { formatSalaryRange } from "../utils/currency";
import { formatLocation } from "../utils/workMode";

type Tab = "overview" | "history" | "interviews" | "contacts" | "notes";

const cardStyle: React.CSSProperties = {
	background: "#fff",
	border: "1px solid var(--color-border)",
	borderRadius: 14,
	padding: 20,
};

const emptyStateStyle: React.CSSProperties = {
	border: "1px dashed var(--color-border)",
	borderRadius: 14,
	padding: "48px 20px",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	gap: 12,
	color: "var(--color-text-muted)",
	fontSize: 13.5,
	cursor: "pointer",
};

const emptyStateIconStyle: React.CSSProperties = {
	width: 32,
	height: 32,
	borderRadius: "50%",
	background: "var(--color-accent)",
	color: "#fff",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
};

const addTileStyle: React.CSSProperties = {
	border: "1px dashed var(--color-border)",
	borderRadius: 14,
	padding: "14px 20px",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	color: "var(--color-text-muted)",
	cursor: "pointer",
};

const addTileIconStyle: React.CSSProperties = {
	width: 24,
	height: 24,
	borderRadius: "50%",
	background: "var(--color-accent)",
	color: "#fff",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	flex: "none",
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
	alignSelf: "flex-end",
};

function toDateTimeLocal(iso: string): string {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ApplicationDetailPage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { showToast } = useToast();
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
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
	const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
	const [editingContactId, setEditingContactId] = useState<string | null>(null);

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
		try {
			await updateApplication(id, request);
			showToast(t("applications.toasts.updated"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleDeleteApplication() {
		if (!id) return;
		if (!window.confirm(t("applications.confirmDelete"))) return;
		try {
			await deleteApplication(id);
			showToast(t("applications.toasts.deleted"), "success");
			navigate("/applications");
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	async function handleChangeStatus(status: ApplicationStatus) {
		if (!id) return;
		try {
			await changeApplicationStatus(id, status);
			setChangingStage(false);
			showToast(t("applications.toasts.statusChanged"), "success");
			await refresh();
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	async function handleAddNote(text: string) {
		if (!id) return;
		try {
			await createNote(id, { text });
			setShowNoteForm(false);
			showToast(t("applicationDetail.toasts.noteAdded"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleAddInterview(round: string, interviewer: string, scheduledAt: string, mode: string, notesText: string) {
		if (!id) return;
		try {
			await createInterview(id, {
				round,
				interviewer: interviewer || undefined,
				scheduledAt: new Date(scheduledAt).toISOString(),
				mode: mode || undefined,
				notes: notesText || undefined,
			});
			setShowInterviewForm(false);
			showToast(t("applicationDetail.toasts.interviewAdded"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleAddContact(name: string, role: string, email: string) {
		if (!id) return;
		try {
			await createContact(id, { name, role: role || undefined, email: email || undefined });
			setShowContactForm(false);
			showToast(t("applicationDetail.toasts.contactAdded"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleUpdateNote(noteId: string, text: string) {
		if (!id) return;
		try {
			await updateNote(id, noteId, { text });
			setEditingNoteId(null);
			showToast(t("applicationDetail.toasts.noteUpdated"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleDeleteNote(noteId: string) {
		if (!id) return;
		if (!window.confirm(t("applicationDetail.confirmDeleteNote"))) return;
		try {
			await deleteNote(id, noteId);
			showToast(t("applicationDetail.toasts.noteDeleted"), "success");
			await refresh();
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	async function handleUpdateInterview(
		interviewId: string,
		round: string,
		interviewer: string,
		scheduledAt: string,
		mode: string,
		notesText: string
	) {
		if (!id) return;
		try {
			await updateInterview(id, interviewId, {
				round,
				interviewer: interviewer || undefined,
				scheduledAt: new Date(scheduledAt).toISOString(),
				mode: mode || undefined,
				notes: notesText || undefined,
			});
			setEditingInterviewId(null);
			showToast(t("applicationDetail.toasts.interviewUpdated"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleDeleteInterview(interviewId: string) {
		if (!id) return;
		if (!window.confirm(t("applicationDetail.confirmDeleteInterview"))) return;
		try {
			await deleteInterview(id, interviewId);
			showToast(t("applicationDetail.toasts.interviewDeleted"), "success");
			await refresh();
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
	}

	async function handleUpdateContact(contactId: string, name: string, role: string, email: string) {
		if (!id) return;
		try {
			await updateContact(id, contactId, { name, role: role || undefined, email: email || undefined });
			setEditingContactId(null);
			showToast(t("applicationDetail.toasts.contactUpdated"), "success");
			await refresh();
		} catch (error) {
			showToast(t("applications.toasts.error"), "error");
			throw error;
		}
	}

	async function handleDeleteContact(contactId: string) {
		if (!id) return;
		if (!window.confirm(t("applicationDetail.confirmDeleteContact"))) return;
		try {
			await deleteContact(id, contactId);
			showToast(t("applicationDetail.toasts.contactDeleted"), "success");
			await refresh();
		} catch {
			showToast(t("applications.toasts.error"), "error");
		}
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
						{formatLocation(application.location, application.workMode)
							? ` · ${formatLocation(application.location, application.workMode)}`
							: ""}
						{formatSalaryRange(application.salaryMin, application.salaryMax, application.currency)
							? ` · ${formatSalaryRange(application.salaryMin, application.salaryMax, application.currency)}`
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
									<div style={{ height: 20, display: "flex", alignItems: "center", flex: "none" }}>
										<div
											style={{
												width: 10,
												height: 10,
												borderRadius: "50%",
												background: i === history.length - 1 ? "var(--color-accent)" : "oklch(80% 0.02 250)",
												flex: "none",
											}}
										/>
									</div>
									{i < history.length - 1 && <div style={{ width: 1, flex: 1, background: "oklch(88% 0.007 250)" }} />}
								</div>
								<div style={{ paddingBottom: i < history.length - 1 ? 26 : 0 }}>
									<div style={{ fontWeight: 700, fontSize: 14 }}>{t(`status.${h.status}`)}</div>
									<div style={{ fontSize: 12, color: "var(--color-text-faint)", marginTop: 3 }}>
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
					{interviews.map((iv) =>
						editingInterviewId === iv.id ? (
							<InterviewForm
								key={iv.id}
								initial={iv}
								onSubmit={(round, interviewer, scheduledAt, mode, notesText) =>
									handleUpdateInterview(iv.id, round, interviewer, scheduledAt, mode, notesText)
								}
								onClose={() => setEditingInterviewId(null)}
							/>
						) : (
							<div key={iv.id} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 6 }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
									<span style={{ fontWeight: 700, fontSize: 14 }}>{iv.round}</span>
									<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
										<span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
											{formatDateTime(iv.scheduledAt)}
										</span>
										<KebabMenu
											ariaLabel={t("applicationDetail.interviewActionsAria", { round: iv.round })}
											items={[
												{
													label: t("common.edit"),
													onClick: () => {
														setShowInterviewForm(false);
														setEditingInterviewId(iv.id);
													},
												},
												{ label: t("common.delete"), onClick: () => handleDeleteInterview(iv.id), variant: "danger" },
											]}
										/>
									</div>
								</div>
								{(iv.interviewer || iv.mode) && (
									<div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
										{[iv.interviewer, iv.mode].filter(Boolean).join(" · ")}
									</div>
								)}
								{iv.notes && <div style={{ fontSize: 13, color: "oklch(35% 0.012 250)", marginTop: 4 }}>{iv.notes}</div>}
							</div>
						)
					)}
					{showInterviewForm && (
						<InterviewForm onSubmit={handleAddInterview} onClose={() => setShowInterviewForm(false)} />
					)}
					{interviews.length > 0 && !showInterviewForm && (
						<div
							style={addTileStyle}
							onClick={() => {
								setEditingInterviewId(null);
								setShowInterviewForm(true);
							}}
							role="button"
							aria-label={t("applicationDetail.addInterview")}
							title={t("applicationDetail.addInterview")}
						>
							<div style={addTileIconStyle}>
								<PlusIcon />
							</div>
						</div>
					)}
					{interviews.length === 0 && !showInterviewForm && (
						<div style={emptyStateStyle} onClick={() => setShowInterviewForm(true)}>
							<div style={emptyStateIconStyle}>
								<PlusIcon />
							</div>
							{t("applicationDetail.noInterviews")}
						</div>
					)}
				</div>
			)}

			{tab === "contacts" && (
				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{contacts.length > 0 && (
					<div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
						{contacts.map((c) =>
							editingContactId === c.id ? (
								<ContactForm
									key={c.id}
									initial={c}
									onSubmit={(name, role, email) => handleUpdateContact(c.id, name, role, email)}
									onClose={() => setEditingContactId(null)}
								/>
							) : (
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
									<div style={{ minWidth: 0, flex: 1 }}>
										<div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
										{c.role && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{c.role}</div>}
										{c.email && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{c.email}</div>}
									</div>
									<KebabMenu
										ariaLabel={t("applicationDetail.contactActionsAria", { name: c.name })}
										items={[
											{
												label: t("common.edit"),
												onClick: () => {
													setShowContactForm(false);
													setEditingContactId(c.id);
												},
											},
											{ label: t("common.delete"), onClick: () => handleDeleteContact(c.id), variant: "danger" },
										]}
									/>
								</div>
							)
						)}
						{showContactForm ? (
							<ContactForm onSubmit={handleAddContact} onClose={() => setShowContactForm(false)} />
						) : (
							<div
								style={addTileStyle}
								onClick={() => {
									setEditingContactId(null);
									setShowContactForm(true);
								}}
								role="button"
								aria-label={t("applicationDetail.addContact")}
								title={t("applicationDetail.addContact")}
							>
								<div style={addTileIconStyle}>
									<PlusIcon />
								</div>
							</div>
						)}
					</div>
					)}
					{contacts.length === 0 && showContactForm && (
						<ContactForm onSubmit={handleAddContact} onClose={() => setShowContactForm(false)} />
					)}
					{contacts.length === 0 && !showContactForm && (
						<div style={emptyStateStyle} onClick={() => setShowContactForm(true)}>
							<div style={emptyStateIconStyle}>
								<PlusIcon />
							</div>
							{t("applicationDetail.noContacts")}
						</div>
					)}
				</div>
			)}

			{tab === "notes" && (
				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{notes.map((n) =>
						editingNoteId === n.id ? (
							<NoteForm
								key={n.id}
								initial={n}
								onSubmit={(text) => handleUpdateNote(n.id, text)}
								onClose={() => setEditingNoteId(null)}
							/>
						) : (
							<div key={n.id} style={{ ...cardStyle, padding: "16px 18px" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
									<div style={{ fontSize: 11.5, color: "var(--color-text-faint)" }}>
										{formatDateTime(n.createdAt)}
									</div>
									<KebabMenu
										ariaLabel={t("applicationDetail.noteActionsAria")}
										items={[
											{
												label: t("common.edit"),
												onClick: () => {
													setShowNoteForm(false);
													setEditingNoteId(n.id);
												},
											},
											{ label: t("common.delete"), onClick: () => handleDeleteNote(n.id), variant: "danger" },
										]}
									/>
								</div>
								<div style={{ fontSize: 13.5, color: "oklch(30% 0.012 250)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
									{n.text}
								</div>
							</div>
						)
					)}
					{showNoteForm && <NoteForm onSubmit={handleAddNote} onClose={() => setShowNoteForm(false)} />}
					{notes.length > 0 && !showNoteForm && (
						<div
							style={addTileStyle}
							onClick={() => {
								setEditingNoteId(null);
								setShowNoteForm(true);
							}}
							role="button"
							aria-label={t("applicationDetail.addNote")}
							title={t("applicationDetail.addNote")}
						>
							<div style={addTileIconStyle}>
								<PlusIcon />
							</div>
						</div>
					)}
					{notes.length === 0 && !showNoteForm && (
						<div style={emptyStateStyle} onClick={() => setShowNoteForm(true)}>
							<div style={emptyStateIconStyle}>
								<PlusIcon />
							</div>
							{t("applicationDetail.noNotes")}
						</div>
				)}
				</div>
			)}

			{editing && (
				<ApplicationFormModal
					initial={application}
					onSubmit={handleUpdate}
					onClose={() => setEditing(false)}
					onDelete={handleDeleteApplication}
				/>
			)}
		</AppShell>
	);
}

function NoteForm({
	initial,
	onSubmit,
	onClose,
}: {
	initial?: Note;
	onSubmit: (text: string) => Promise<void>;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const [text, setText] = useState(initial?.text ?? "");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!text.trim()) return;
		setSubmitting(true);
		try {
			await onSubmit(text);
			if (!initial) setText("");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ ...cardStyle, position: "relative", paddingTop: 44, display: "flex", flexDirection: "column", gap: 10 }}>
			<CloseButton onClick={onClose} />
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={t("applicationDetail.noteForm.placeholder")}
				style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
			/>
			<button type="submit" disabled={submitting} style={addButtonStyle}>
				{initial ? t("applicationDetail.noteForm.saveCta") : t("applicationDetail.noteForm.submit")}
			</button>
		</form>
	);
}

function InterviewForm({
	initial,
	onSubmit,
	onClose,
}: {
	initial?: Interview;
	onSubmit: (round: string, interviewer: string, scheduledAt: string, mode: string, notes: string) => Promise<void>;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const [round, setRound] = useState(initial?.round ?? "");
	const [interviewer, setInterviewer] = useState(initial?.interviewer ?? "");
	const [scheduledAt, setScheduledAt] = useState(initial ? toDateTimeLocal(initial.scheduledAt) : "");
	const [mode, setMode] = useState(initial?.mode ?? "");
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!round.trim() || !scheduledAt) return;
		setSubmitting(true);
		try {
			await onSubmit(round, interviewer, scheduledAt, mode, notes);
			if (!initial) {
				setRound("");
				setInterviewer("");
				setScheduledAt("");
				setMode("");
				setNotes("");
			}
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ ...cardStyle, position: "relative", paddingTop: 44, display: "flex", flexDirection: "column", gap: 10 }}>
			<CloseButton onClick={onClose} />
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
				{initial ? t("applicationDetail.interviewForm.saveCta") : t("applicationDetail.interviewForm.submit")}
			</button>
		</form>
	);
}

function ContactForm({
	initial,
	onSubmit,
	onClose,
}: {
	initial?: Contact;
	onSubmit: (name: string, role: string, email: string) => Promise<void>;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const [name, setName] = useState(initial?.name ?? "");
	const [role, setRole] = useState(initial?.role ?? "");
	const [email, setEmail] = useState(initial?.email ?? "");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		try {
			await onSubmit(name, role, email);
			if (!initial) {
				setName("");
				setRole("");
				setEmail("");
			}
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ ...cardStyle, position: "relative", paddingTop: 44, display: "flex", flexDirection: "column", gap: 10 }}>
			<CloseButton onClick={onClose} />
			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
				</div>
				<input
					placeholder={t("applicationDetail.contactForm.emailPlaceholder")}
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					style={inputStyle}
				/>
			</div>
			<button type="submit" disabled={submitting} style={addButtonStyle}>
				{initial ? t("applicationDetail.contactForm.saveCta") : t("applicationDetail.contactForm.submit")}
			</button>
		</form>
	);
}
