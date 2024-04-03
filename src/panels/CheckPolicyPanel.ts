import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as fs from 'fs';
import { AccessAnalyzerClient, CheckAccessNotGrantedCommand, CheckNoNewAccessCommand, FindingDetails, ValidatePolicyCommand, ValidatePolicyFindingType } from "@aws-sdk/client-accessanalyzer";
import { exec } from "child_process";

export class CheckPolicyPanel {
  public static currentPanel: CheckPolicyPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private region = "us-west-2";
  private client = new AccessAnalyzerClient({region: this.region});
  private static editedDocument: string = "";
  private static editedDocumentFileName: string = "";

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._setWebviewMessageListener(this._panel.webview);
    this._setActiveTextEditorListener();
    if(vscode.window.activeTextEditor){
      fs.readFile(vscode.window.activeTextEditor?.document.uri.path, (err, data) => {
        CheckPolicyPanel.editedDocumentFileName = vscode.window.activeTextEditor?.document.uri.path!;
        CheckPolicyPanel.editedDocument = data.toString();
        CheckPolicyPanel.currentPanel!._panel.webview.postMessage({command: 'input-text', message: CheckPolicyPanel.editedDocumentFileName});
      });
    }
  }

  public static render(extensionUri: vscode.Uri) {
    if (CheckPolicyPanel.currentPanel) {
        CheckPolicyPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
    } else {
        const panel = vscode.window.createWebviewPanel(
            'policyCheck',
            'Custom Policy Check',
            vscode.ViewColumn.Beside,
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

  private _setActiveTextEditorListener(){
    vscode.window.onDidChangeActiveTextEditor(
      (message: any) => {
        const editedFile = vscode.window.activeTextEditor?.document;
        CheckPolicyPanel.editedDocumentFileName = editedFile!.uri.path;
        CheckPolicyPanel.currentPanel!._panel.webview.postMessage({command: 'input-text', message: CheckPolicyPanel.editedDocumentFileName});
        CheckPolicyPanel.editedDocument = editedFile!.getText();
      },
    undefined,
    this._disposables
    );
    vscode.workspace.onDidChangeTextDocument(
      (message: any) => {
        const editedFile = vscode.window.activeTextEditor?.document;
        CheckPolicyPanel.editedDocument = editedFile!.getText();
      }
    );
  }
  
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;

        switch (command) {
          case "run-check-access-not-granted-jsn":
            const checkAccessNotGrantedInput = {
              policyDocument: CheckPolicyPanel.editedDocument,
              access: [
                {
                  actions: message.actions
                }
              ],
              policyType: message.type,
            };
            const checkAccessNotGrantedCommand = new CheckAccessNotGrantedCommand(checkAccessNotGrantedInput);
            try {
              const checkAccessNotGrantedResponse = await this.client.send(checkAccessNotGrantedCommand);
              const reasons = checkAccessNotGrantedResponse.reasons?.forEach((reason) => {
                return "Reason:" + reason.description + "\nStatement ID:" + reason.statementId + "\nIndex:" + reason.statementIndex
              });
              vscode.window.showInformationMessage(checkAccessNotGrantedResponse.result + ": " + checkAccessNotGrantedResponse.message + "\n" + (reasons ? reasons! : ""));
            } catch (e: any) {
              vscode.window.showErrorMessage(e.message);
            }
            return;
          case "run-check-no-new-access-jsn":
            const checkNoNewAccessInput = {
              newPolicyDocument: CheckPolicyPanel.editedDocument,
              existingPolicyDocument: message.control,
              policyType: message.type,
            };
            const checkNoNewAccessCommand = new CheckNoNewAccessCommand(checkNoNewAccessInput);
            try {
              const checkNoNewAccessResponse = await this.client.send(checkNoNewAccessCommand);
              const reasons = checkNoNewAccessResponse.reasons?.forEach((reason) => {
                return "Reason:" + reason.description + "\nStatement ID:" + reason.statementId + "\nIndex:" + reason.statementIndex
              });
              vscode.window.showInformationMessage(checkNoNewAccessResponse.result + ": " + checkNoNewAccessResponse.message + "\n" + (reasons ? reasons! : ""));
            } catch (e: any) {
              vscode.window.showErrorMessage(e.message);
            }
            return;
          case "control-path":
            if (fs.existsSync(message.text)) {
              fs.readFile(message.text, (err, data) => {
                webview.postMessage({command: 'control-text', message: data.toString()});
              });
            }
            return;
          case "validate-policy-jsn":
            const validatePolicyInput = {
              policyDocument: CheckPolicyPanel.editedDocument,
              policyType: message.type
            };
            const validatePolicyCommand = new ValidatePolicyCommand(validatePolicyInput);
            try {
              const validatePolicyResponse = await this.client.send(validatePolicyCommand);
              if(validatePolicyResponse.findings!.length > 0) {
                validatePolicyResponse.findings!.forEach(finding => {
                  if(finding.findingType === ValidatePolicyFindingType.ERROR) {
                    vscode.window.showErrorMessage(finding.findingType + ": " + finding.findingDetails + "\n" + finding.locations?.toString());
                  } else {
                    vscode.window.showWarningMessage(finding.findingType + ": " + finding.findingDetails + "\n" + finding.locations?.toString());
                  }
                });
              } else {
                vscode.window.showInformationMessage("Policy checks did not discover any problems with your policy!");
              }
            } catch (e: any) {
              vscode.window.showErrorMessage(e.message);
            }
          case "validate-policy-tf":
            return;
          case "validate-policy-cfn":
            const templatePath = CheckPolicyPanel.editedDocumentFileName;
            const command = `cfn-policy-validator validate --template-path ${templatePath} --region ${this.region}`;
            exec(command, (err, output) => {
              if(err){
                vscode.window.showErrorMessage("Failed to run command: " + err);
              } else {
                vscode.window.showInformationMessage(output);
              }
            });
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}
