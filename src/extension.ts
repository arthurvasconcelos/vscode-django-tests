import * as vscode from "vscode";
import testingContext, { Context } from "./setup";
import { getErrorMessage } from "./errors";
import { discoverTests } from "./service";

export async function activate(extensionContext: vscode.ExtensionContext) {
  let context: Context | null = null;

  try {
    context = await testingContext(extensionContext);
    discoverTests(context);
  } catch (e) {
    vscode.window.showErrorMessage(getErrorMessage(e));
  }
}
