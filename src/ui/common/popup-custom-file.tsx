import * as React from "react";
import * as RDC from "react-dom/client";
import { Popup } from "./popup";
import { formatErrorText } from "../util";

export class PopupCustomFile extends React.Component<PopupCustomFile.Props> {
  private selfRef = React.createRef<HTMLDivElement>();

  private dismiss() {
    document.body.removeChild(this.props.parentElement);
  }

  private async postToDatabase(coordsData: any) {
    try {
      const userAgent = "dnatco.datmos.org internal 0.0.1";
      const response = await fetch("https://maxit.datmos.org/convert.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          coordsdata: coordsData,
          userAgent: userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();
      const message = result.message;
      const cifData = result.cifdata;

      if (result.status === "error") {
        Popup.create(<>{formatErrorText(message)}</>);
      }

      console.log(result, "Result");

      this.props.onRepairSuccess(cifData, message);

      this.dismiss();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  componentDidMount() {
    if (this.selfRef.current) {
      this.selfRef.current.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" || ev.key === "Enter") this.dismiss();
      });
      this.selfRef.current.focus();
    }
  }

  render() {
    // Check if this is an error that can be potentially fixed by MAXIT
    // LLKA errors suggest geometry issues
    // Parsing errors (from tscif/tspdb) suggest format issues
    const isLlkaError = this.props.errorMessage.includes("LLKA_E_");
    const isParsingError = this.props.errorMessage.includes("Mismatching categories") ||
                           this.props.errorMessage.includes("Cannot parse") ||
                           this.props.errorMessage.includes("Invalid");
    const canRepair = isLlkaError || isParsingError;

    return (
      <div
        ref={this.selfRef}
        className="absolute top-0 left-0 w-screen h-screen z-999 bg-test flex items-center justify-center"
        tabIndex={0}
      >
        <div className="bg-primary-first flex flex-col p-6 rounded-standard max-w-[50%] text-white">
          <div className="text-xl font-bold mb-4">Error Processing Structure</div>
          {canRepair
            ? (
              <div className="mb-4">
                <div className="mb-4">
                  Cannot process structure. Your file is not formatted according to
                  PDB/mmCIF standards. We can try to repair the file by uploading to our
                  server, which will attempt to fix it.
                </div>
                <div className="text-red-400 mb-4">
                  Error: {this.props.errorMessage}
                </div>
                <div className="text-sm">
                  <strong>Warning:</strong> This will upload your structure to an external server (maxit.datmos.org).
                </div>
                <div className="h-4" />
                <div>
                  Do you want to repair your file?
                </div>
              </div>
            )
            : <div className="text-red-500 mb-4">{this.props.errorMessage}</div>
          }
          <div className="flex justify-end gap-4">
            {canRepair && (
              <button
                onClick={() => this.postToDatabase(this.props.jsonData)}
                className="bg-secondary-second text-primary-first items-center flex justify-center px-4 py-1 cursor-pointer rounded-smaller hover:bg-secondary-second-hover transition-all"
              >
                Repair file
              </button>
            )}

            <button
              onClick={() => this.dismiss()}
              className="bg-secondary-second text-primary-first items-center flex justify-center px-4 py-1 cursor-pointer rounded-smaller hover:bg-secondary-second-hover transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export namespace PopupCustomFile {
  export interface Props {
    parentElement: HTMLElement;
    onRepairSuccess: (data: any, message: any) => void;
    errorMessage: any;
    jsonData?: any;
  }

  export function create(
    onRepairSuccess: (repairedData: any, message: any) => void,
    errorMessage: any,
    jsonData?: any
  ) {
    const tainer = document.createElement("div");
    document.body.appendChild(tainer);

    const reactRoot = RDC.createRoot(tainer!);
    reactRoot.render(
      <PopupCustomFile
        parentElement={tainer}
        onRepairSuccess={onRepairSuccess}
        jsonData={jsonData}
        errorMessage={errorMessage}
      ></PopupCustomFile>
    );
  }
}
