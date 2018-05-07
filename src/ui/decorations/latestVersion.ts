/**
 * Decoration to show latest vesion at the right side of the
 * depencency.
 */
import { window } from "vscode";

export default (text: string) =>
  window.createTextEditorDecorationType({
    after: {
      contentText: text,
      margin: "2em",
    }
  });
