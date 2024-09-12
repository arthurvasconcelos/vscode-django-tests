import * as vscode from "vscode";
import { executeProcess } from "./process-runner";
import { Context } from "./setup";

type DiscoveredTestType = "folder" | "file" | "class" | "test";

type DiscoveredTestCommon = {
  path: string;
  name: string;
  type_: DiscoveredTestType;
  id_: string;
  runID: string;
};

type DiscoveredTestItem = DiscoveredTestCommon & {
  lineno: number;
};

type DiscoveredTestNode = DiscoveredTestCommon & {
  children: (DiscoveredTestNode | DiscoveredTestItem)[];
};

type TestPayload = {
  test?: string;
  outcome?: string;
  message?: string;
  traceback?: string;
  subtest?: string;
  duration?: number;
};

type TestExecutionOutput = {
  [testId: string]: TestPayload;
};

export function isDiscoveredTestNode(
  node: DiscoveredTestCommon
): node is DiscoveredTestNode {
  return Object.keys(node).includes("children");
}

export function isDiscoveredTestItem(
  node: DiscoveredTestCommon
): node is DiscoveredTestItem {
  return !isDiscoveredTestNode(node);
}

function createTestNode(
  nodeJson: DiscoveredTestNode | DiscoveredTestItem,
  collection: vscode.TestItemCollection,
  testController: vscode.TestController
) {
  const testNode: vscode.TestItem = testController.createTestItem(
    nodeJson.runID,
    nodeJson.name,
    vscode.Uri.file(nodeJson.path)
  );

  if (isDiscoveredTestItem(nodeJson)) {
    testNode.range = new vscode.Range(
      new vscode.Position(Number(nodeJson.lineno) - 1, 0),
      new vscode.Position(Number(nodeJson.lineno), 0)
    );
  }

  collection.add(testNode);

  if (isDiscoveredTestNode(nodeJson)) {
    nodeJson.children.map(
      (childNodeJson: DiscoveredTestNode | DiscoveredTestItem) => {
        createTestNode(childNodeJson, testNode.children, testController);
      }
    );
  }
}

export function getTestCaseNodes(
  testNode: vscode.TestItem,
  collection: vscode.TestItem[] = []
) {
  if (!testNode.children.size) {
    collection.push(testNode);
  }

  testNode.children.forEach((c) => {
    if (testNode.children.size) {
      getTestCaseNodes(c, collection);
    } else {
      collection.push(testNode);
    }
  });

  return collection;
}

export async function discoverTests(context: Context): Promise<void> {
  const process = executeProcess({
    context,
    command: "discovery.py",
  });
  const result = await process.complete();
  const testTreeJson = JSON.parse(result.output);
  createTestNode(
    testTreeJson,
    context.testController.items,
    context.testController
  );
}

export async function runTests({
  context,
  request,
  token,
  shouldDebug = false,
}: {
  context: Context;
  request: vscode.TestRunRequest;
  token: vscode.CancellationToken;
  shouldDebug?: boolean;
}) {
  const run = context.testController.createTestRun(request);
  const queue: vscode.TestItem[] = [];

  if (request.include) {
    request.include.forEach((test) => queue.push(test));
  } else {
    context.testController.items.forEach((test) => queue.push(test));
  }

  const testIds: string = queue.map((value) => value.id).join(" ");
  const testItemMap: Map<string, vscode.TestItem> = new Map();

  queue.forEach((testItem) => {
    const nodes = getTestCaseNodes(testItem);
    nodes.forEach((childTestItem) => {
      testItemMap.set(childTestItem.id, childTestItem);
      childTestItem.busy = true;
    });
  });

  const process = executeProcess({
    context,
    command: "runner.py",
    args: ["--tests", testIds],
  });
  const result = await process.complete();

  const data: TestExecutionOutput = JSON.parse(result.output);

  Object.entries(data).forEach(([testId, testData]) => {
    const testItem = testItemMap.get(testId);
    const msg = new vscode.TestMessage(testData.message ?? "");

    if (!testItem) {
      return;
    }
    testItem.busy = false;

    if (testData.outcome === "success") {
      run.passed(testItem, testData.duration);
    }

    if (testData.outcome === "failure") {
      run.failed(testItem, msg, testData.duration);
    }

    if (testData.outcome === "error") {
      run.errored(testItem, msg, testData.duration);
    }
  });

  run.end();
}
