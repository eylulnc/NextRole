import { useEffect, useRef, useState } from "react";
import { DotsIcon } from "./IconButton";

interface MenuItem {
	label: string;
	onClick: () => void;
	variant?: "default" | "danger";
}

interface Props {
	items: MenuItem[];
	ariaLabel: string;
}

export function KebabMenu({ items, ariaLabel }: Props) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handleOutsideClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", handleOutsideClick);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	return (
		<div ref={containerRef} style={{ position: "relative" }}>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
				aria-label={ariaLabel}
				aria-haspopup="menu"
				aria-expanded={open}
				title={ariaLabel}
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: 30,
					height: 30,
					border: "none",
					borderRadius: 8,
					background: "transparent",
					color: "var(--color-text-muted)",
					cursor: "pointer",
				}}
			>
				<DotsIcon />
			</button>
			{open && (
				<div
					role="menu"
					onClick={(e) => e.stopPropagation()}
					style={{
						position: "absolute",
						top: "calc(100% + 4px)",
						right: 0,
						background: "#fff",
						border: "1px solid var(--color-border)",
						borderRadius: 12,
						boxShadow: "0 12px 32px oklch(22% 0.014 250 / 0.12)",
						padding: 6,
						display: "flex",
						flexDirection: "column",
						gap: 2,
						zIndex: 5,
						minWidth: 140,
					}}
				>
					{items.map((item) => (
						<button
							key={item.label}
							type="button"
							role="menuitem"
							onClick={() => {
								setOpen(false);
								item.onClick();
							}}
							style={{
								border: "none",
								background: "transparent",
								borderRadius: 8,
								padding: "8px 10px",
								font: "500 13px var(--font-body)",
								textAlign: "left",
								cursor: "pointer",
								color: item.variant === "danger" ? "oklch(50% 0.15 30)" : "var(--color-text)",
							}}
						>
							{item.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
