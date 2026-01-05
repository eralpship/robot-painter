import { AddElementDropdown } from "./AddElementDropdown";
import { ElementOrderDropdown } from "./ElementOrderDropdown";

export function AddElementToolbar() {
	return (
		<>
			<AddElementDropdown />
			<ElementOrderDropdown />
		</>
	);
}
