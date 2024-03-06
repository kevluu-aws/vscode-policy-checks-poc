import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as fs from 'fs';
import { AccessAnalyzerClient, CheckAccessNotGrantedCommand, CheckNoNewAccessCommand } from "@aws-sdk/client-accessanalyzer";

export class CheckPolicyPanel {
  public static currentPanel: CheckPolicyPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private client = new AccessAnalyzerClient({region: 'us-west-2'});

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri) {
    if (CheckPolicyPanel.currentPanel) {
        CheckPolicyPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
        const panel = vscode.window.createWebviewPanel(
            'policyCheck',
            'Custom Policy Check',
            vscode.ViewColumn.One,
            {
              // Enable javascript in the webview
              enableScripts: true,
              // Restrict the webview to only load resources from the `out` directory
              localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out'), vscode.Uri.joinPath(extensionUri, "webview/build")]
            }
        );
      CheckPolicyPanel.currentPanel = new CheckPolicyPanel(panel, extensionUri);
    }
  }

  public dispose() {
    CheckPolicyPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      "webview",
      "build",
      "static",
      "css",
      "main.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "webview",
      "build",
      "static",
      "js",
      "main.js",
    ]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
          <meta name="theme-color" content="#000000">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Custom Policy Checks</title>
        </head>
        <body>
          <noscript>You need to enable JavaScript to run this app.</noscript>
          <div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
  
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;

        switch (command) {
          case "run-check-access-not-granted":
            const checkAccessNotGrantedInput = {
              policyDocument: message.input,
              access: message.actions,
              policyType: message.type,
            };
            const checkAccessNotGrantedCommand = new CheckAccessNotGrantedCommand(checkAccessNotGrantedInput);
            const checkAccessNotGrantedResponse = await this.client.send(checkAccessNotGrantedCommand);
            vscode.window.showInformationMessage(checkAccessNotGrantedResponse.message + ": " + checkAccessNotGrantedResponse.result);
            return;
          case "run-check-no-new-access":
            const checkNoNewAccessInput = {
              newPolicyDocument: message.input,
              existingPolicyDocument: message.control,
              policyType: message.type,
            };
            const checkNoNewAccessCommand = new CheckNoNewAccessCommand(checkNoNewAccessInput);
            const checkNoNewAccessResponse = await this.client.send(checkNoNewAccessCommand);
            vscode.window.showInformationMessage(checkNoNewAccessResponse.message + ": " + checkNoNewAccessResponse.result);
            return;
          case "control-path":
            if (fs.existsSync(message.text)) {
              fs.readFile(message.text, (err, data) => {
                webview.postMessage({command: 'control-text', message: data.toString()});
              });
            }
            return;
          case "input-path":
            if (fs.existsSync(message.text)) {
              fs.readFile(message.text, (err, data) => {
                webview.postMessage({command: 'input-text', message: data.toString()});
              });
            }
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }
}
