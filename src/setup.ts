import * as vscode from "vscode";
import {
  MissingPeerDependencyError,
  NoWorkspaceError,
  InvalidPythonInterpreterError,
  MissingExtensionConfigurationError,
  MissingConfigurationValueError,
} from "./errors";

type PeerDependencies = {
  python: vscode.Extension<any>;
};

type ExtensionSettings = {
  projectDirName: string;
  projectDirUri: vscode.Uri;
  settingsModule: string;
};

type ProcessRunConfiguration = {
  cwd: string;
  environment: Record<string, string | undefined>;
  acceptedExitCodes?: readonly number[];
};

export type Context = Awaited<ReturnType<typeof context>>;

export default async function context(
  extensionContext: vscode.ExtensionContext
) {
  const extensionUri = extensionContext.extensionUri;

  async function getAndActivatePeerDependencies(): Promise<PeerDependencies> {
    const python = vscode.extensions.getExtension("ms-python.python");
    if (python === undefined) {
      throw new MissingPeerDependencyError("Python");
    }

    if (!python.isActive) {
      await python.activate();
    }
    await python.exports.ready;

    return {
      python,
    };
  }

  const peerDependencies = await getAndActivatePeerDependencies();

  function pickWorkspaceFolder() {
    if (!vscode.workspace.workspaceFolders?.length) {
      throw new NoWorkspaceError();
    }

    return vscode.workspace.workspaceFolders[0];
  }

  const workspaceFolder = pickWorkspaceFolder();

  function findPythonInterpreter() {
    const usingNewInterpreterStorage: boolean =
      peerDependencies.python?.packageJSON?.featureFlags
        ?.usingNewInterpreterStorage;

    if (!usingNewInterpreterStorage) {
      throw new InvalidPythonInterpreterError();
    }

    const executionDetails =
      peerDependencies.python?.exports.settings.getExecutionDetails(
        workspaceFolder.uri
      );

    return vscode.Uri.file(executionDetails.execCommand[0]);
  }

  const interpreterPath = findPythonInterpreter();

  function getSettings(): ExtensionSettings {
    const workspaceConfiguration: vscode.WorkspaceConfiguration =
      vscode.workspace.getConfiguration("djangoTests");

    if (!workspaceConfiguration) {
      throw new MissingExtensionConfigurationError();
    }

    const projectDirName = workspaceConfiguration.get<string>("rootDir");
    if (!projectDirName) {
      throw new MissingConfigurationValueError("rootDir");
    }

    const projectDirUri = vscode.Uri.joinPath(
      workspaceFolder.uri,
      projectDirName
    );

    const settingsModule = workspaceConfiguration.get<string>("settingsModule");
    if (!settingsModule) {
      throw new MissingConfigurationValueError("settingsModule");
    }

    return {
      projectDirName,
      projectDirUri,
      settingsModule,
    };
  }

  const settings = getSettings();

  function getEnvConfig(): ProcessRunConfiguration {
    return {
      cwd: settings.projectDirUri.fsPath,
      environment: {
        DJANGO_SETTINGS_MODULE: settings.settingsModule,
      },
    };
  }

  return {
    extensionUri,
    peerDependencies,
    workspaceFolder,
    interpreterPath,
    settings,
    testController: vscode.tests.createTestController(
      "django-tests-provider",
      "Django Tests"
    ),
    getEnvConfig,
  };
}
