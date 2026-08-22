import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SettingsModal } from "./SettingsModal";
import { LogoMark, Wordmark } from "./Logo";

interface NavItem {
	path: string;
	labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
	{ path: "/dashboard", labelKey: "nav_links.dashboard" },
	{ path: "/applications", labelKey: "nav_links.applications" },
	{ path: "/calendar", labelKey: "nav_links.calendar" },
	{ path: "/analytics", labelKey: "nav_links.analytics" },
];

const COLLAPSED_KEY = "nextrole_sidebar_collapsed";
const EXPANDED_WIDTH = 232;
const COLLAPSED_WIDTH = 76;

export function AppShell({ children }: { children: ReactNode }) {
	const { email, logout } = useAuth();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "true");
	const [showSettings, setShowSettings] = useState(false);

	function toggleCollapsed() {
		setCollapsed((v) => {
			const next = !v;
			localStorage.setItem(COLLAPSED_KEY, String(next));
			return next;
		});
	}

	return (
		<div style={{ height: "100vh", display: "flex" }}>
			<aside
				style={{
					width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
					flex: "none",
					height: "100%",
					background: "var(--color-sidebar-bg)",
					borderRight: "1px solid var(--color-sidebar-border)",
					display: "flex",
					flexDirection: "column",
					padding: "24px 16px",
					gap: 28,
					position: "relative",
					transition: "width 0.15s ease",
				}}
			>
				<button
					onClick={toggleCollapsed}
					aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
					title={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
					style={{
						position: "absolute",
						top: 20,
						right: -12,
						width: 24,
						height: 24,
						borderRadius: "50%",
						border: "1px solid var(--color-border)",
						background: "var(--color-surface)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 12,
						lineHeight: 1,
						zIndex: 1,
					}}
				>
					{collapsed ? "›" : "‹"}
				</button>

				<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", overflow: "hidden" }}>
					<LogoMark size={28} />
					{!collapsed && <Wordmark size={22} />}
				</div>
				<nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{NAV_ITEMS.map((item) => {
						const active = location.pathname.startsWith(item.path);
						return (
							<div
								key={item.path}
								onClick={() => navigate(item.path)}
								title={collapsed ? t(item.labelKey) : undefined}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									padding: collapsed ? "10px" : "10px 12px",
									justifyContent: collapsed ? "center" : "flex-start",
									borderRadius: 10,
									cursor: "pointer",
									font: "500 14px var(--font-body)",
									background: active ? "var(--color-surface)" : "transparent",
									color: active ? "var(--color-text)" : "var(--color-text-muted)",
								}}
							>
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: 3,
										background: active ? "var(--color-accent)" : "var(--color-sidebar-dot-inactive)",
										flex: "none",
									}}
								/>
								{!collapsed && <span style={{ whiteSpace: "nowrap" }}>{t(item.labelKey)}</span>}
							</div>
						);
					})}
				</nav>
				<div
					style={{
						marginTop: "auto",
						display: "flex",
						alignItems: "center",
						gap: 10,
						padding: collapsed ? "10px 0" : "10px 8px",
						justifyContent: collapsed ? "center" : "flex-start",
						borderTop: "1px solid var(--color-sidebar-border)",
					}}
				>
					<div
						onClick={collapsed ? logout : undefined}
						title={collapsed ? t("nav.logOut") : undefined}
						style={{
							width: 32,
							height: 32,
							borderRadius: "50%",
							background: "var(--color-sidebar-dot-inactive)",
							flex: "none",
							cursor: collapsed ? "pointer" : "default",
						}}
					/>
					{!collapsed && (
						<div style={{ minWidth: 0 }}>
							<div style={{ font: "600 13px var(--font-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
								{email}
							</div>
							<div style={{ display: "flex", gap: 6, fontSize: 12 }}>
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										setShowSettings(true);
									}}
									style={{ textDecoration: "none" }}
								>
									{t("nav.settings")}
								</a>
								<span style={{ color: "var(--color-text-faint)" }}>·</span>
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										logout();
									}}
									style={{ textDecoration: "none" }}
								>
									{t("nav.logOut")}
								</a>
							</div>
						</div>
					)}
				</div>
			</aside>
			{showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
			<main
				style={{
					flex: 1,
					minWidth: 0,
					height: "100%",
					overflowY: "auto",
					padding: "36px 44px",
					display: "flex",
					flexDirection: "column",
					gap: 24,
				}}
			>
				{children}
			</main>
		</div>
	);
}
