import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
	const { t } = useTranslation();
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
				zIndex: 20,
			}}
			onClick={onCancel}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "#fff",
					borderRadius: 16,
					padding: 24,
					width: "100%",
					maxWidth: 380,
					display: "flex",
					flexDirection: "column",
					gap: 18,
				}}
			>
				<p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--color-text)" }}>{message}</p>
				<div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
					<button
						type="button"
						onClick={onCancel}
						style={{
							border: "1px solid var(--color-border)",
							borderRadius: 10,
							padding: "9px 16px",
							background: "#fff",
							color: "var(--color-text)",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
						}}
					>
						{t("common.cancel")}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						style={{
							border: "none",
							borderRadius: 10,
							padding: "9px 16px",
							background: "oklch(50% 0.15 30)",
							color: "#fff",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
						}}
					>
						{t("common.delete")}
					</button>
				</div>
			</div>
		</div>
	);
}

export function useConfirm() {
	const [message, setMessage] = useState<string | null>(null);
	const resolver = useRef<((value: boolean) => void) | null>(null);

	function confirm(msg: string): Promise<boolean> {
		setMessage(msg);
		return new Promise((resolve) => {
			resolver.current = resolve;
		});
	}

	function handleConfirm() {
		resolver.current?.(true);
		setMessage(null);
	}

	function handleCancel() {
		resolver.current?.(false);
		setMessage(null);
	}

	const dialog = message !== null ? <ConfirmDialog message={message} onConfirm={handleConfirm} onCancel={handleCancel} /> : null;

	return { confirm, dialog };
}
