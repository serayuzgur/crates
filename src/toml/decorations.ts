/**
 * Helps to manage decorations for the TOML files.
 */
import { DecorationOptions, Range, TextEditor } from "vscode";
import { versions } from "../api";
import { statusBarItem } from "../ui/indicators";

/**
 * Create a decoration for the given crate.
 * @param editor 
 * @param crate 
 * @param version 
 * @param versions 
 */
function decoration(
  editor: TextEditor,
  crate: string,
  version: string,
  versions: string[],
) {
  const asText = `${crate}="${version}"`;
  const start = editor.document.getText().indexOf(asText);
  const end = start + asText.length;

  return {
    range: new Range(
      editor.document.positionAt(start),
      editor.document.positionAt(end),
    ),
    hoverMessage: `Available: \n${versions.join(",\n")}`,
    renderOptions: {
      after: {
        contentText: `Latest: ${version}`,
      },
    },
  };
}

/**
 * Takes parsed dependencies object, fetches all the versions and creates necessary decorations.
 * @param editor 
 * @param dependencies 
 * @param finalize 
 */
export function dependencies(
  editor: TextEditor,
  dependencies: any,
  finalize: (result:DecorationOptions[]) => void,
): void {
  const options: DecorationOptions[] = [];
  const responses = Object.keys(dependencies).map((key: string) => {
    console.log("Fetching dependency: ",key);
    return versions(key)
      .then(function(htmlString: string) {
        const json = JSON.parse(htmlString);
        const versions = json.versions.map((item: any) => item["num"]);
        const decor = decoration(editor, key, dependencies[key], versions);
        options.push(decor);
      })
      .catch(function(err: Error) {
        console.error(err);
      });
  });
  Promise.all(responses).then(() => {
    console.log("All fetched! 👏");
    finalize(options);
    statusBarItem.setText();
  });
}

export default {
  dependencies,
};
