import type { ReactNode } from "react";

interface PageContainerProps {
	children: ReactNode;
	className?: string;
	withPattern?: boolean;
}

export function PageContainer({
	children,
	className = "",
	withPattern = true,
}: PageContainerProps) {
	const baseClasses = withPattern
		? "h-screen w-screen bg-page-background relative overflow-hidden"
		: "h-screen w-screen bg-page-background";

	return (
		<div className={baseClasses}>
			{withPattern && (
				<>
					{/* Gradient background */}
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							background:
								"radial-gradient(ellipse at bottom center, #1a1e24 0%, #0d0f12 50%, #000000 100%)",
						}}
					/>
					{/* Tiled robot pattern */}
					<div
						className="absolute inset-0 opacity-[0.08] pointer-events-none"
						style={{
							backgroundImage: "url(/robot-pattern.png)",
							backgroundRepeat: "repeat",
							backgroundSize: "27px 27px",
						}}
					/>
				</>
			)}
			<div className={`relative z-10 h-full w-full ${className}`.trim()}>
				{children}
			</div>
		</div>
	);
}
