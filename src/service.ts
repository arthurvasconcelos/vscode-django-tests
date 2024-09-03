import * as vscode from "vscode";
import { executeProcess } from "./process-runner";
import { Context } from "./setup";

export type DiscoveredTestType = "folder" | "file" | "class" | "test";

export type DiscoveredTestCommon = {
  path: string;
  name: string;
  type_: DiscoveredTestType;
  id_: string;
  runID: string;
};

export type DiscoveredTestItem = DiscoveredTestCommon & {
  lineno: number;
};

export type DiscoveredTestNode = DiscoveredTestCommon & {
  children: (DiscoveredTestNode | DiscoveredTestItem)[];
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
