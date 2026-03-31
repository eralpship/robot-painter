import { Loader2 } from "lucide-react";
import { PageContainer } from "./PageContainer";

export function EditorLoading() {
	return (
		<PageContainer className="flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<Loader2 className="size-10 text-white/70 animate-spin" />
				<p className="text-gray-400 text-sm">Loading editor...</p>
			</div>
		</PageContainer>
	);
}
