import { ChildProcess, spawn } from "child_process";
import * as vscode from "vscode";
import * as iconv from "iconv-lite";
import {
  CantDecodeProcessOutputError,
  ProcessExecutionError,
  ProcessExitedWithUnexpectedExitCodeError,
} from "./errors";
import { Context } from "./setup";

type ProcessRunConfiguration = {
  cwd?: string;
  environment?: { [key: string]: string | undefined };
  acceptedExitCodes?: readonly number[];
};

type Commands = "discovery.py";

type CommandOutput = {
  exitCode: number;
  output: string;
};

function decode(buffers: Buffer[]) {
  return iconv.decode(Buffer.concat(buffers), "utf8");
}

function commandProcessExecution(
  command: string,
  args?: string[],
  configuration?: ProcessRunConfiguration
) {
  const commandProcess: ChildProcess = spawn(command, args, {
    cwd: configuration?.cwd,
    env: {
      ...process.env,
      ...configuration?.environment,
    },
  });
  const pid = commandProcess.pid ?? -1;
  const acceptedExitCodes: readonly number[] =
    configuration?.acceptedExitCodes || [0];

  async function complete() {
    return new Promise<CommandOutput>((resolve, reject) => {
      const stdoutBuffer: Buffer[] = [];
      const stderrBuffer: Buffer[] = [];

      commandProcess.stdout!.on("data", (chunk) => stdoutBuffer.push(chunk));
      commandProcess.stderr!.on("data", (chunk) => stderrBuffer.push(chunk));

      commandProcess.once("close", (exitCode) => {
        if (exitedWithUnexpectedExitCode(exitCode) && !commandProcess.killed) {
          reject(
            new ProcessExitedWithUnexpectedExitCodeError(
              String(exitCode),
              decode(stderrBuffer)
            )
          );
          return;
        }

        const output = decode(stdoutBuffer);
        if (!output) {
          if (stdoutBuffer.length > 0) {
            reject(new CantDecodeProcessOutputError());
          }
        }

        resolve({ exitCode: exitCode ?? 0, output });
      });

      commandProcess.once("error", (error) => {
        reject(new ProcessExecutionError(error.message));
      });
    });
  }

  function cancel() {
    commandProcess.kill("SIGINT");
  }

  function exitedWithUnexpectedExitCode(exitCode: number | null) {
    return exitCode !== null && acceptedExitCodes.indexOf(exitCode) < 0;
  }

  return {
    pid,
    complete,
    cancel,
  };
}

export function executeProcess({
  context,
  command,
  args = [],
}: {
  context: Context;
  command: Commands;
  args?: string[];
}) {
  const commandPath = vscode.Uri.joinPath(context.extensionUri, "cli", command);
  const fullArgs: string[] = [commandPath.fsPath].concat(args);

  return commandProcessExecution(
    context.interpreterPath.fsPath,
    fullArgs,
    context.getEnvConfig()
  );
}
