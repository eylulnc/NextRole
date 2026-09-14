import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
	message: string;
	confirmLabel?: string;
	danger?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({ message, confirmLabel, danger = true, onConfirm, onCancel }: ConfirmDialogProps) {
	const { t } = useTranslation();
	return (
		<div
			role="dialog"
			aria-modal="true"
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--color-overlay-backdrop)",
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
					background: "var(--color-surface)",
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
							background: "var(--color-surface)",
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
							background: danger ? "var(--color-danger)" : "var(--color-accent)",
							color: "var(--color-on-accent)",
							font: "600 13px var(--font-body)",
							cursor: "pointer",
						}}
					>
						{confirmLabel ?? t("common.delete")}
					</button>
				</div>
			</div>
		</div>
	);
}

interface ConfirmOptions {
	confirmLabel?: string;
	danger?: boolean;
}

export function useConfirm() {
	const [message, setMessage] = useState<string | null>(null);
	const [options, setOptions] = useState<ConfirmOptions>({});
	const resolver = useRef<((value: boolean) => void) | null>(null);

	function confirm(msg: string, opts?: ConfirmOptions): Promise<boolean> {
		setMessage(msg);
		setOptions(opts ?? {});
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

	const dialog =
		message !== null ? (
			<ConfirmDialog
				message={message}
				confirmLabel={options.confirmLabel}
				danger={options.danger}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		) : null;

	return { confirm, dialog };
}
