import { debounce } from "lodash";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface ColorPickerButtonProps {
	label: string;
	color: string;
	onChange: (color: string) => void;
	debounceMs?: number;
	disabled?: boolean;
	icon?: LucideIcon;
}

export function ColorPickerButton({
	label,
	color,
	onChange,
	debounceMs = 0,
	disabled = false,
	icon: Icon,
}: ColorPickerButtonProps) {
	const [localColor, setLocalColor] = useState(color);
	const colorInputRef = useRef<HTMLInputElement>(null);

	// Create debounced onChange if debounceMs > 0
	const debouncedOnChange = useMemo(
		() =>
			debounceMs > 0
				? debounce((newColor: string) => onChange(newColor), debounceMs)
				: onChange,
		[onChange, debounceMs],
	);

	// Sync local color when prop changes
	useEffect(() => {
		setLocalColor(color);
	}, [color]);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newColor = e.target.value;
			setLocalColor(newColor);
			debouncedOnChange(newColor);
		},
		[debouncedOnChange],
	);

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={() => colorInputRef.current?.click()}
			className="gap-2"
			disabled={disabled}
		>
			{Icon && <Icon className="size-4" />}
			{label}
			<span
				className="w-4 h-4 rounded-sm border border-white/20"
				style={{ backgroundColor: localColor }}
			/>
			<input
				ref={colorInputRef}
				type="color"
				value={localColor}
				onChange={handleChange}
				className="sr-only"
				disabled={disabled}
			/>
		</Button>
	);
}
