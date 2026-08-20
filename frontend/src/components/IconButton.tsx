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
				color: variant === "danger" ? "oklch(50% 0.15 30)" : "var(--color-text-muted)",
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
