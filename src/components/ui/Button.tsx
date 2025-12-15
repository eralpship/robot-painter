import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
}

export function Button({ children, className = "", ...props }: ButtonProps) {
	return (
		<button
			type="button"
			className={`cursor-pointer px-2 py-0.5 border border-border rounded-button bg-surface hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
