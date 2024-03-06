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
          setInputTextArea(event.data.message);
          return
      }
    });
  })

  function handleRunClick() {
    if(controlLabel === "Control policies"){
      vscode.postMessage({
        command: "run-check-no-new-access",
        input: inputTextArea,
        control: controlTextArea,
        type: policyType
      });
    } else {
      vscode.postMessage({
        command: "run-check-access-not-granted",
        input: inputTextArea,
        actions: controlTextArea,
        type: policyType
      });
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

  const [controlTextArea, setControlTextArea] = useState("");
  const [inputTextArea, setInputTextArea] = useState("");
  
  function handleControlPathChange(event: any){
    vscode.postMessage({
      command: "control-path",
      text: event.target.value,
    });
  }

  function handleInputPathChange(event: any){
    vscode.postMessage({
      command: "input-path",
      text: event.target.value,
    });
  }

  return (
    <main>
      <h1>Policy Checks</h1>
      <div className="config-container">
        <div className="dropdown-container">
          <label htmlFor="api-function">Check Type</label>
          <VSCodeDropdown id="api-function" onChange={(event) => handleApiFunctionChange(event)}>
            <VSCodeOption>CheckNoNewAccess</VSCodeOption>
            <VSCodeOption>CheckAccessNotGranted</VSCodeOption>
          </VSCodeDropdown>
        </div>
        <div className="dropdown-container">
          <label htmlFor="template-selection">Policy Language</label>
          <VSCodeDropdown id="template-selection">
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
        <div className="button-container">
          <VSCodeButton id="run-button" onClick={handleRunClick}>Run</VSCodeButton>
        </div>
      </div>
      <VSCodeDivider role="separator"></VSCodeDivider>
      <div className="policy-text-area-container">
        <VSCodeTextArea rows={30} name="input" placeholder="Enter policy document" value={inputTextArea}>Input policies</VSCodeTextArea>
        <VSCodeTextArea rows={30} name="control" placeholder={controlPlaceholder} value={controlTextArea}>{controlLabel}</VSCodeTextArea>
      </div>
      <div className="path-container">
        <div className="input-path-container">
          <VSCodeTextField id="input-path-text-field" onChange={(event) => handleInputPathChange(event)} placeholder="Input policy file path"></VSCodeTextField>
        </div>
        <div className="control-path-container">
          <VSCodeTextField id="control-path-text-field" onChange={(event) => handleControlPathChange(event)} placeholder="Control policy file path"></VSCodeTextField>
        </div>
      </div>
    </main>
  );
}

export default App;