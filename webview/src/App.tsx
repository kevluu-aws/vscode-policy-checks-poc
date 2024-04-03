import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeDivider, VSCodeDropdown, VSCodeOption, VSCodeTextArea, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useState, useEffect } from "react";

function App() {
  useEffect(() => {
    window.addEventListener('message', event => {
      const command = event.data.command;
      switch (command) {
        case "control-text": 
          setControlTextArea(event.data.message);
          return
        case "input-text":
          setInputPath(event.data.message);
          setInputPathSize(event.data.message.length);
          return
      }
    });
  })

  function handleRunClick() {
    switch(documentType) {
      case "JSON Policy Language":
        if(controlLabel === "Control policies"){
          vscode.postMessage({
            command: "run-check-no-new-access-jsn",
            control: controlTextArea,
            type: policyType
          });
        } else {
          vscode.postMessage({
            command: "run-check-access-not-granted-jsn",
            actions: controlTextArea.split(','),
            type: policyType
          });
        }
        return
      case "Terraform":
        if(controlLabel === "Control policies"){
          vscode.postMessage({
            command: "run-check-no-new-access-tf",
            control: controlTextArea,
            type: policyType
          });
        } else {
          vscode.postMessage({
            command: "run-check-access-not-granted-tf",
            actions: controlTextArea.split(','),
            type: policyType
          });
        }
        return
      case "CloudFormation":
        if(controlLabel === "Control policies"){
          vscode.postMessage({
            command: "run-check-no-new-access-cfn",
            control: controlTextArea,
            type: policyType
          });
        } else {
          vscode.postMessage({
            command: "run-check-access-not-granted-cfn",
            actions: controlTextArea.split(','),
            type: policyType
          });
        }
        return
    }

  }

  function handleValidateRunClick() {
    switch(documentType) {
      case "JSON Policy Language":
        vscode.postMessage({
          command: "validate-policy-jsn",
          type: policyType
        });
        return
      case "Terraform":
        vscode.postMessage({
          command: "validate-policy-tf",
          type: policyType
        });
        return
      case "CloudFormation":
        vscode.postMessage({
          command: "validate-policy-cfn",
          type: policyType
        });
        return
    }
  }

  const [controlLabel, setControlLabel] = useState("Control policies");
  const [controlPlaceholder, setControlPlaceholder] = useState("Enter control policy document")
  function handleApiFunctionChange(event: any){
    switch(event.target.value) {
      case "CheckNoNewAccess": {
        setControlLabel("Control policies");
        setControlPlaceholder("Enter control policy document")
        break;
      }
      case "CheckAccessNotGranted": {
        setControlLabel("List of actions");
        setControlPlaceholder("Enter list of actions")
        break;
      }
    }
  };

  const [policyType, setPolicyType] = useState("IDENTITY_POLICY");
  function handlePolicyTypeChange(event: any){
    switch(event.target.value){
      case "Identity": {
        setPolicyType("IDENTITY_POLICY");
        break;
      }
      case "Resource": {
        setPolicyType("RESOURCE_POLICY");
        break;
      }
    }
  }

  function handleTextAreaChange(event: any, command: string){
    switch(command){
      case "control": {
        setControlTextArea(event.target.value);
        break;
      }
    }
  }

  const [controlTextArea, setControlTextArea] = useState("");
  const [controlPathSize, setControlPathSize] = useState(20);
  function handleControlPathChange(event: any){
    vscode.postMessage({
      command: "control-path",
      text: event.target.value,
    });
    setControlPathSize(event.target.value.length);
  }

  const [inputPathSize, setInputPathSize] = useState(20);
  const [inputPath, setInputPath] = useState("");

  const [documentType, setDocumentType] = useState("JSON Policy Language");
  function handleDocumentTypeChange(event: any) {
    setDocumentType(event.target.value);
  }

  return (
    <main>
      <div>
        <h1>Policy Checks</h1>
        <div className="input-path-container">
          <VSCodeTextField id="input-path-text-field" value={inputPath} size={inputPathSize}readOnly disabled placeholder="Input policy file path">Currently Read Input File</VSCodeTextField>
        </div>
        <div className="main-dropdown-container">
          <div className="dropdown-container">
            <label htmlFor="template-selection">Policy Language</label>
            <VSCodeDropdown id="template-selection" onChange={(event) => handleDocumentTypeChange(event)}>
              <VSCodeOption>JSON Policy Language</VSCodeOption>
              <VSCodeOption>CloudFormation</VSCodeOption>
              <VSCodeOption>Terraform</VSCodeOption>
            </VSCodeDropdown>
          </div>
          <div className="dropdown-container">
            <label htmlFor="policy-type-selection">Policy Type</label>
            <VSCodeDropdown id="policy-type-selection" onChange={(event) => handlePolicyTypeChange(event)}>
              <VSCodeOption>Identity</VSCodeOption>
              <VSCodeOption>Resource</VSCodeOption>
            </VSCodeDropdown>
          </div>
        </div>
      </div>
      <VSCodeDivider role="separator"></VSCodeDivider>
      <h2>Validate Policies</h2>
      <div className="validate-container">
        <p> IAM Access Analyzer validates your policy against IAM policy grammar and AWS best practices. You can view policy validation check findings that include security warnings, errors, general warnings, and suggestions for your policy. These findings provide actionable recommendations that help you author policies that are functional and conform to security best practices. </p>
        <div className="validate-button-container">
          <VSCodeButton id="validate-run-button" onClick={handleValidateRunClick}>Run Policy Validation</VSCodeButton>
        </div>
      </div>
      <VSCodeDivider role="separator"></VSCodeDivider>
      <h2>Custom Checks</h2>
      <p>You can validate your policies against your specified security standards using AWS Identity and Access Management Access Analyzer custom policy checks.</p>
      <div className="config-container">
        <div className="dropdown-container">
          <label htmlFor="api-function">Check Type</label>
          <VSCodeDropdown id="api-function" onChange={(event) => handleApiFunctionChange(event)}>
            <VSCodeOption>CheckNoNewAccess</VSCodeOption>
            <VSCodeOption>CheckAccessNotGranted</VSCodeOption>
          </VSCodeDropdown>
        </div>
        <div className="control-path-container">
          <VSCodeTextField id="control-path-text-field" onChange={(event) => handleControlPathChange(event)} size={controlPathSize} placeholder="Control policy file path">Control File</VSCodeTextField>
        </div>
      </div>
      <div className="policy-text-area-container">
        <VSCodeTextArea rows={30} name="control" onChange={(event) => handleTextAreaChange(event, "control")} placeholder={controlPlaceholder} value={controlTextArea}>{controlLabel}</VSCodeTextArea>
      </div>
      <div className="button-container">
          <VSCodeButton id="run-button" onClick={handleRunClick}>Run Custom Policy Check</VSCodeButton>
      </div>
    </main>
  );
}

export default App;