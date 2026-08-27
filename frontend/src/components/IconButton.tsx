interface Props {
	onClick: () => void;
	label: string;
	variant?: "default" | "danger";
	children: React.ReactNode;
}

export function IconButton({ onClick, label, variant = "default", children }: Props) {
	return (
		<button
			onClick={onClick}
			aria-label={label}
			title={label}
			style={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: 30,
				height: 30,
				border: "none",
				borderRadius: 8,
				background: "transparent",
				color: variant === "danger" ? "var(--color-danger)" : "var(--color-text-muted)",
				cursor: "pointer",
			}}
		>
			{children}
		</button>
	);
}

export function PencilIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
		</svg>
	);
}

export function PlusIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</svg>
	);
}

export function XIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M18 6 6 18" />
			<path d="M6 6l12 12" />
		</svg>
	);
}

export function DotsIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
			<circle cx="5" cy="12" r="2" />
			<circle cx="12" cy="12" r="2" />
			<circle cx="19" cy="12" r="2" />
		</svg>
	);
}

export function FilterIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
		</svg>
	);
}

export function GearIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
		</svg>
	);
}

export function EyeIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

export function EyeOffIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a20.4 20.4 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
			<path d="M1 1l22 22" />
		</svg>
	);
}

export function DragHandleIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
			<circle cx="8" cy="5" r="1.6" />
			<circle cx="16" cy="5" r="1.6" />
			<circle cx="8" cy="12" r="1.6" />
			<circle cx="16" cy="12" r="1.6" />
			<circle cx="8" cy="19" r="1.6" />
			<circle cx="16" cy="19" r="1.6" />
		</svg>
	);
}

export function CheckIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

export function ChevronDownIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M5 7.5l5 5 5-5" />
		</svg>
	);
}

export function TrashIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 6h18" />
			<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
			<path d="M10 11v6" />
			<path d="M14 11v6" />
		</svg>
	);
}
