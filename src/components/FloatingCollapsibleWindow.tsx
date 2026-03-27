import type React from "react";
import { useState } from "react";
import { Rnd } from "react-rnd";

const headerHeight = 40;
const minSize = 200;

export function FloatingCollapsibleWindow({
	title,
	children,
	x: defaultX,
	y: defaultY,
	width: defaultWidth,
	height: defaultHeight,
	defaultCollapsed,
}: {
	title: string;
	children?: React.ReactNode;
	x: number;
	y: number;
	width: number;
	height: number;
	defaultCollapsed?: boolean;
}) {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? false);
	const [size, setSize] = useState({
		width: defaultWidth,
		height: defaultHeight,
	});

	const toggleCollapse = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent drag when clicking toggle button
		setIsCollapsed(!isCollapsed);
	};

	return (
		<Rnd
			default={{ x: defaultX, y: defaultY, ...size }}
			size={isCollapsed ? { width: size.width, height: headerHeight } : size}
			onResize={(_e, _direction, ref, _delta, _position) => {
				setSize({
					width: parseInt(ref.style.width, 10),
					height: isCollapsed ? headerHeight : parseInt(ref.style.height, 10),
				});
			}}
			minWidth={minSize}
			minHeight={isCollapsed ? headerHeight : minSize}
			maxHeight={isCollapsed ? headerHeight : undefined}
			bounds="window"
			dragHandleClassName="drag-handle"
			className="rounded-window shadow-window font-mono text-ui select-none overflow-hidden outline outline-2 outline-border-muted"
			style={{ zIndex: 50 }}
			enableResizing={isCollapsed ? { right: true, left: true } : true}
		>
			<div className="w-full h-full flex flex-col min-h-0">
				<div
					className={`bg-surface-elevated text-foreground-muted flex items-center cursor-grab min-h-toolbar px-3 hover:text-foreground ${isCollapsed ? "rounded-b-window" : ""}`}
				>
					<button
						type="button"
						className="bg-transparent border-none text-inherit cursor-pointer p-0.5 flex items-center justify-center rounded-button transition-colors w-[18px] h-[18px] shrink-0"
						onClick={toggleCollapse}
						aria-label={isCollapsed ? "Expand" : "Collapse"}
					>
						<svg
							width="12"
							height="8"
							viewBox="0 0 9 5"
							className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
							aria-hidden="true"
						>
							<path
								d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"
								fill="currentColor"
							/>
						</svg>
					</button>
					<span className="flex-1 text-center mr-[18px] select-none drag-handle text-[11px]">
						{title}
					</span>
				</div>
				<div className="flex-1 flex items-center justify-center text-xs font-normal text-foreground-subtle min-h-0 overflow-hidden checkered-background">
					{children}
				</div>
			</div>
		</Rnd>
	);
}
