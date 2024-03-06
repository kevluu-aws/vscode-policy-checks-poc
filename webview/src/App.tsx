import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeDivider, VSCodeDropdown, VSCodeOption, VSCodeTextArea, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useState, useEffect } from "react";

function App() {
  useEffect(() => {
    window.addEventListener('message', event => {
      const command = event.data.command;
      if(command === "control-text"){
        setControlTextArea(event.data.message);
      }
    });
  })

  function handleRunClick() {
    vscode.postMessage({
      command: "run",
      text: "Policy check result: PASS",
    });
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

  const [controlTextArea, setControlTextArea] = useState("");
  
  function handlePathChange(event: any){
    vscode.postMessage({
      command: "control-path",
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
          <VSCodeDropdown id="policy-type-selection">
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
        <VSCodeTextArea rows={30} name="input" placeholder="Enter policy document">Input policies</VSCodeTextArea>
        <VSCodeTextArea rows={30} name="control" placeholder={controlPlaceholder} value={controlTextArea}>{controlLabel}</VSCodeTextArea>
      </div>
      <div className="path-container">
        <div className="input-path-container">
          <VSCodeTextField id="input-path-text-field" placeholder="Input policy file path"></VSCodeTextField>
        </div>
        <div className="control-path-container">
          <VSCodeTextField id="control-path-text-field" onChange={(event) => handlePathChange(event)} placeholder="Control policy file path"></VSCodeTextField>
        </div>
      </div>
    </main>
  );
}

export default App;