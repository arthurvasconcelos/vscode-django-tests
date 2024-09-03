import { EXTENSION_SETTINGS_NAME } from "./constants";

export class MissingPeerDependencyError extends Error {
  constructor(dependency: string) {
    super(`VSCode ${dependency} extension is required`);
    this.name = "MissingPeerDependencyError";
  }
}

export class NoWorkspaceError extends Error {
  constructor() {
    super("Cannot find a valid workspace folder");
    this.name = "NoWorkspaceError";
  }
}

export class InvalidPythonInterpreterError extends Error {
  constructor() {
    super("Cannot find a valid Python interpreter");
    this.name = "InvalidPythonInterpreterError";
  }
}

export class MissingExtensionConfigurationError extends Error {
  constructor() {
    super("Extension is not configured");
    this.name = "MissingExtensionConfigurationError";
  }
}

export class MissingConfigurationValueError extends Error {
  constructor(property: string) {
    super(`Please fill the '${EXTENSION_SETTINGS_NAME}.${property}' setting`);
    this.name = "MissingConfigurationValueError";
  }
}

export class ProcessExitedWithUnexpectedExitCodeError extends Error {
  constructor(exitCode: string, message: string) {
    super(`Process exited with code ${exitCode}: ${message}`);
    this.name = "ProcessExitedWithUnexpectedExitCodeError";
  }
}

export class CantDecodeProcessOutputError extends Error {
  constructor() {
    super("Can not decode process output");
    this.name = "CantDecodeProcessOutputError";
  }
}

export class ProcessExecutionError extends Error {
  constructor(message: string) {
    super(`Error occurred during process execution: ${message}`);
    this.name = "ProcessExecutionError";
  }
}

export function getErrorMessage(maybeError: unknown) {
  return maybeError instanceof Error
    ? `${maybeError.name}: ${maybeError.message}`
    : "Unknown error";
}
