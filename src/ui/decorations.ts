/**
 * Holds common decorations.
 */
import { window } from "vscode";

/**
 * Decoration to show latest vesion at the right side of the
 * depencency.
 */
export const latestVersion = (text: string) =>
  window.createTextEditorDecorationType({
    after: {
      contentText: text,
      margin: "2em",
    },
  });

export default { latestVersion };
