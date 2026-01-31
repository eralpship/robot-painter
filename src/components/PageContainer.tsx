import type { ReactNode } from "react";

interface PageContainerProps {
	children: ReactNode;
	className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
	return (
		<div
			className={`h-screen w-screen bg-page-background ${className}`.trim()}
		>
			{children}
		</div>
	);
}
