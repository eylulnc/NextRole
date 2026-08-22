export function LogoMark({ size = 28 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 40 40" style={{ flex: "none" }}>
			<path
				d="M10 32 L10 9 L30 31 L30 9"
				stroke="var(--color-text)"
				strokeWidth="3.4"
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="none"
			/>
			<circle cx="30" cy="9" r="4.4" fill="var(--color-accent)" />
		</svg>
	);
}

export function Wordmark({ size = 17 }: { size?: number }) {
	return (
		<span style={{ font: `700 ${size}px var(--font-heading)`, letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>
			Next<span style={{ color: "var(--color-accent)" }}>Role</span>
		</span>
	);
}
