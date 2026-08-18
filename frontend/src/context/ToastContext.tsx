import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error";

interface Toast {
	id: number;
	message: string;
	variant: ToastVariant;
}

interface ToastContextValue {
	showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const dismissToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		(message: string, variant: ToastVariant = "success") => {
			const id = Date.now() + Math.random();
			setToasts((prev) => [...prev, { id, message, variant }]);
			setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
		},
		[dismissToast]
	);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div
				style={{
					position: "fixed",
					bottom: 24,
					right: 24,
					display: "flex",
					flexDirection: "column",
					gap: 10,
					zIndex: 100,
				}}
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						style={{
							background: toast.variant === "success" ? "oklch(45% 0.14 150)" : "oklch(50% 0.19 25)",
							color: "#fff",
							padding: "12px 14px 12px 18px",
							borderRadius: 10,
							font: "500 13px var(--font-body)",
							boxShadow: "0 8px 24px oklch(22% 0.014 250 / 0.25)",
							minWidth: 220,
							maxWidth: 360,
							display: "flex",
							alignItems: "center",
							gap: 10,
						}}
					>
						<span style={{ flex: 1 }}>{toast.message}</span>
						<button
							type="button"
							onClick={() => dismissToast(toast.id)}
							aria-label="Dismiss"
							style={{
								border: "none",
								background: "transparent",
								color: "#fff",
								opacity: 0.75,
								cursor: "pointer",
								fontSize: 15,
								lineHeight: 1,
								padding: 2,
								flex: "none",
							}}
						>
							×
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
