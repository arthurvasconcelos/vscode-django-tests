import * as vscode from "vscode";
import testingContext, { Context } from "./setup";
import { getErrorMessage, NoContextError } from "./errors";
import { discoverTests, runTests } from "./service";

export async function activate(extensionContext: vscode.ExtensionContext) {
  let context: Context | null = null;

  try {
    context = await testingContext(extensionContext);
    discoverTests(context);
    context.testController.createRunProfile(
      "Run",
      vscode.TestRunProfileKind.Run,
      (request, token) => {
        if (!context) throw new NoContextError();
        runTests({ context, request, token });
      }
    );
    context.testController.createRunProfile(
      "Debug",
      vscode.TestRunProfileKind.Debug,
      (request, token) => {
        if (!context) throw new NoContextError();
        runTests({ context, request, token, shouldDebug: true });
      }
    );
  } catch (e) {
    vscode.window.showErrorMessage(getErrorMessage(e));
  }
}

export function deactivate() {}
