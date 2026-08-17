import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
	const { email, logout } = useAuth();

	return (
		<div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
			<header
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "16px 32px",
					borderBottom: "1px solid var(--color-border)",
					background: "var(--color-surface)",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-accent)" }} />
					<span style={{ font: "700 17px var(--font-heading)" }}>NextRole</span>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
					<span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{email}</span>
					<button
						onClick={logout}
						style={{
							border: "1px solid var(--color-border)",
							background: "var(--color-surface)",
							borderRadius: 8,
							padding: "8px 14px",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
						}}
					>
						Log out
					</button>
				</div>
			</header>
			<main style={{ flex: 1, padding: "36px 44px", display: "flex", flexDirection: "column", gap: 24 }}>
				{children}
			</main>
		</div>
	);
}
