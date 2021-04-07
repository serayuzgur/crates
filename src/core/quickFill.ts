import { TextEditor, Range } from "vscode";
import Dependency from "./Dependency";
import Item from "./Item";

export default async function quickFillDependencies(editor: TextEditor, dependencies: Item[], fetchedDeps: Dependency[]) {
	if (dependencies.length === 0 || fetchedDeps.length === 0) { return; }
	await editor.edit(edit => {
		for (let i = 0; i < dependencies.length; i++) {
			const dependency = dependencies[i];
			if (dependency.value === "?") {
				const fetchedDep = fetchedDeps[i];
				if (!fetchedDep.versions || fetchedDep.versions?.length === 0) { return; }

				// Make sure we update the value of the Dependency as well.
				dependency.value = fetchedDep.versions[0];

				edit.replace(
					new Range(
						editor.document.positionAt(dependency.start + 1),
						editor.document.positionAt(dependency.end - 1)
					),
					fetchedDep.versions[0]
				);
			}
		}
	});
}