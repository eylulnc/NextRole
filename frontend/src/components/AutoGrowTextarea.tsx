import { useEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function AutoGrowTextarea({ value, style, ...rest }: Props) {
	const ref = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, [value]);

	return <textarea ref={ref} value={value} style={{ ...style, overflow: "hidden" }} {...rest} />;
}
