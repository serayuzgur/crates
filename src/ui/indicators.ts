/**
 * A utility to manage Status Bar operations.
 */
import { window, StatusBarAlignment, StatusBarItem } from "vscode";

/**
 * Extends StatusBarItem in order to add support prefixed text changes.
 */
interface StatusBarItemExt extends StatusBarItem {
  setText: (name?: string) => void;
}

export const statusBarItem: StatusBarItemExt = window.createStatusBarItem(
  StatusBarAlignment.Left,
  0,
);
statusBarItem.text = "Crates: OK";
statusBarItem.setText = (text?: string) =>
  (statusBarItem.text = text ? `Crates: ${text}` : "Crates: OK");

export default {
  statusBarItem,
};
