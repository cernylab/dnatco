import * as React from "react";
import * as RDC from "react-dom/client";
import { Popup } from "./popup";
import { formatErrorText } from "../util";

// Email link component for bot protection
const EmailLink: React.FC<{ user: string; domain: string; subject?: string; className?: string; children: React.ReactNode }> = ({ user, domain, subject, className, children }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const email = `${user}@${domain}`;
    const mailtoUrl = subject ? `mailto:${email}?Subject=${subject}` : `mailto:${email}`;
    window.location.href = mailtoUrl;
  };

  return (
    <a className={className} href="#" onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </a>
  );
};

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
        <div className="bg-primary-first flex flex-col p-6 rounded-standard max-w-[60%] max-h-[80%] text-white">
          <div className="text-xl font-bold mb-4">Error Processing Structure</div>
          <div className="overflow-y-auto pr-2 flex-1 mb-4">
            {canRepair
              ? (
                <div>
                  <div className="mb-4">
                    Cannot process structure. Your file is not formatted according to
                    PDB/mmCIF standards. We can try to repair the file by uploading to our
                    server, which will attempt to fix it.
                  </div>
                  <div className="text-red-400 mb-4 p-3 bg-red-900 bg-opacity-20 rounded border border-red-500 max-h-[200px] overflow-y-auto">
                    <strong>Error:</strong> {this.props.errorMessage}
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
              : <div className="text-red-500 p-3 bg-red-900 bg-opacity-20 rounded border border-red-500 max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words">{this.props.errorMessage}</div>
            }
          </div>
          <div className="text-xs text-gray-400 mb-2 pb-2 border-b border-gray-600">
            If you believe this is a bug, please report it to{" "}
            <EmailLink user="jiri.cerny" domain="ibt.cas.cz" subject="DNATCO" className="text-blue-400 hover:text-blue-300 underline">
              DNATCO authors
            </EmailLink>
          </div>
          <div className="flex justify-end gap-4 pt-2">
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
