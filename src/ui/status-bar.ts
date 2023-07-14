/**
 * A utility to manage Status Bar operations.
 */
import { window, StatusBarAlignment, StatusBarItem } from "vscode";

type Type = "Error"
  | "Warning"
  | "Info"
  | "Loading";

/**
 * Extends StatusBarItem in order to add support prefixed text changes.
*/
interface StatusBarItemExt extends StatusBarItem {
  setText: (t: Type, name?: string) => void;
}

export const StatusBar: StatusBarItemExt = window.createStatusBarItem(
  StatusBarAlignment.Right,
  0,
) as StatusBarItemExt;
StatusBar.setText = (t: Type, text?: string) => {
  switch (t) {
    case 'Error':
      StatusBar.color = "statusBarItem.errorForeground";
      StatusBar.text = "$(error) Crates";
      StatusBar.tooltip = "";
      window.showErrorMessage(text || "Error");
      return;
    case 'Warning':
      StatusBar.text = "$(warning) Crates";
      StatusBar.color = "statusBarItem.warningForeground";
      break;
    case 'Info':
      StatusBar.color = "statusBarItem.foreground";
      StatusBar.text = "$(check-all) Crates";
      break;
    case 'Loading':
      StatusBar.color = "statusBarItem.activeForeground";
      StatusBar.text = "$(sync~spin) Crates";

  }
  if (text) {
    window.setStatusBarMessage(`Crates: ${text}`, 2000);
  }
  StatusBar.tooltip = text;
  StatusBar.command = "crates.retry";


};
export default {
  StatusBar,
};
