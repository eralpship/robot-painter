import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface ColorPickerButtonProps {
	label: string;
	color: string;
	onChange: (color: string) => void;
	debounceMs?: number;
	disabled?: boolean;
}

export function ColorPickerButton({
	label,
	color,
	onChange,
	debounceMs = 0,
	disabled = false,
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
		<div className="relative w-full">
			<Button
				variant="outline"
				size="sm"
				onClick={() => colorInputRef.current?.click()}
				className="gap-2 w-full justify-start"
				disabled={disabled}
			>
				<span
					className="size-4 rounded-sm border border-white/20 shrink-0"
					style={{ backgroundColor: localColor }}
				/>
				{label}
			</Button>
			<input
				ref={colorInputRef}
				type="color"
				value={localColor}
				onChange={handleChange}
				className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
				disabled={disabled}
			/>
		</div>
	);
}
