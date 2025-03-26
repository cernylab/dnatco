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
    // FIXME: This is quite hacky. It expects that when an error occurs
    // during structure geometry processing, libLLKA will return an error which
    // will eventually get converted to a string containing the error code.
    // We are making an assumption that such an error condition suggests
    // a file with improper structure and that running that structure
    // through MAXIT may fix it.
    const isLlkaError = this.props.errorMessage.includes("LLKA_E_");

    return (
      <div
        ref={this.selfRef}
        className="absolute top-0 left-0 h-full w-full z-999 m-auto bg-test"
        tabIndex={0}
      >
        <div className="bg-primary-first flex flex-col mx-auto p-4 relative top-[45%] rounded-standard max-w-[33%] max-h-[20%] overflow-y-scroll text-white">
          {isLlkaError
            ? (
              <div>
                Cannot process structure. Your file is not formatted according to
                PDB standards. We can try to repair the file by uploading to our
                server, which will attempt to fix it.
                Do you want to repair your file?
              </div>
            )
            : <div className="text-red-500">{this.props.errorMessage}</div>
          }
          <div className="flex justify-between mt-4">
            {isLlkaError && (
              <button
                onClick={() => this.postToDatabase(this.props.jsonData)}
                className="bg-secondary-second text-primary-first items-center flex justify-center px-4 py-1 cursor-pointer w-fit rounded-smaller hover:bg-secondary-second-hover transition-all"
              >
                Repair file
              </button>
            )}

            <button
              onClick={() => this.dismiss()}
              className="bg-secondary-second text-primary-first items-center flex justify-center px-4 py-1 cursor-pointer w-fit rounded-smaller hover:bg-secondary-second-hover transition-all"
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
