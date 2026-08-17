import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const inputStyle: React.CSSProperties = {
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	padding: "11px 14px",
	font: "14px var(--font-body)",
	background: "var(--color-input-bg)",
};

const labelStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 6,
	fontSize: 13,
	fontWeight: 500,
	color: "oklch(38% 0.012 250)",
};

export function AuthPage() {
	const { t } = useTranslation();
	const [isSignup, setIsSignup] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const { login, register } = useAuth();
	const navigate = useNavigate();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			if (isSignup) {
				await register(email, password);
			} else {
				await login(email, password);
			}
			navigate("/dashboard");
		} catch {
			setError(isSignup ? t("auth.signupError") : t("auth.loginError"));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "oklch(97% 0.012 60)",
				padding: 24,
			}}
		>
			<div
				style={{
					display: "flex",
					maxWidth: 920,
					width: "100%",
					background: "#fff",
					borderRadius: 24,
					overflow: "hidden",
					boxShadow: "0 20px 60px oklch(22% 0.014 250 / 0.08)",
				}}
			>
				<div style={{ flex: 1, padding: "56px 48px", display: "flex", flexDirection: "column", gap: 28 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
						<div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--color-accent)" }} />
						<span style={{ font: "700 18px var(--font-heading)" }}>{t("app.name")}</span>
					</div>
					<div>
						<h1 style={{ font: "700 28px var(--font-heading)", margin: "0 0 8px" }}>
							{isSignup ? t("auth.createAccountTitle") : t("auth.welcomeBackTitle")}
						</h1>
						<p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 14 }}>
							{isSignup ? t("auth.createAccountSubtitle") : t("auth.welcomeBackSubtitle")}
						</p>
					</div>
					<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<label style={labelStyle}>
							{t("auth.emailLabel")}
							<input
								type="email"
								required
								placeholder={t("auth.emailPlaceholder")}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								style={inputStyle}
							/>
						</label>
						<label style={labelStyle}>
							{t("auth.passwordLabel")}
							<input
								type="password"
								required
								minLength={8}
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								style={inputStyle}
							/>
						</label>
						{error && <p style={{ margin: 0, color: "oklch(50% 0.15 30)", fontSize: 13 }}>{error}</p>}
						<button
							type="submit"
							disabled={submitting}
							style={{
								marginTop: 6,
								border: "none",
								borderRadius: 12,
								padding: 13,
								background: "var(--color-accent)",
								color: "#fff",
								font: "600 14px var(--font-body)",
								cursor: submitting ? "default" : "pointer",
								opacity: submitting ? 0.7 : 1,
							}}
						>
							{isSignup ? t("auth.createAccountCta") : t("auth.signInCta")}
						</button>
					</form>
					<p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
						{isSignup ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
						<a
							href="#"
							onClick={(e) => {
								e.preventDefault();
								setError(null);
								setIsSignup((v) => !v);
							}}
							style={{ fontWeight: 600, textDecoration: "none" }}
						>
							{isSignup ? t("auth.signInLink") : t("auth.signUpLink")}
						</a>
					</p>
				</div>
				<div
					style={{
						flex: 1,
						background:
							"repeating-linear-gradient(135deg, oklch(93% 0.03 35), oklch(93% 0.03 35) 10px, oklch(96% 0.02 35) 10px, oklch(96% 0.02 35) 20px)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<span
						style={{
							font: "500 12px var(--font-mono)",
							color: "oklch(45% 0.08 35)",
							background: "#fff",
							padding: "6px 12px",
							borderRadius: 8,
						}}
					>
						{t("app.name")}
					</span>
				</div>
			</div>
		</div>
	);
}
