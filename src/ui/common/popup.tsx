import * as React from "react";
import * as RDC from "react-dom/client";

interface PopupProps {
  parentElement: HTMLElement;
  children?: React.ReactNode;
  onDismiss?: () => void;
}

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

export class Popup extends React.Component<PopupProps> {
  private selfRef = React.createRef<HTMLDivElement>();

  private dismiss() {
    document.body.removeChild(this.props.parentElement);
    if (this.props.onDismiss) {
      this.props.onDismiss();
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
    return (
      <div
        ref={this.selfRef}
        className="absolute top-0 left-0 h-full w-full z-999 m-auto bg-test flex items-center justify-center"
        tabIndex={0}
      >
        <div className="bg-primary-first flex flex-col mx-auto p-4 rounded-standard max-w-[50%] max-h-[80%] text-white">
          <div className="mb-4 overflow-y-auto pr-2 flex-1">{this.props.children}</div>
          <div className="text-xs text-gray-400 mb-2 pb-2 border-b border-gray-600">
            If you believe this is a bug, please report it to{" "}
            <EmailLink user="jiri.cerny" domain="ibt.cas.cz" subject="DNATCO" className="text-blue-400 hover:text-blue-300 underline">
              DNATCO authors
            </EmailLink>
          </div>
          <div className="flex justify-end pt-2">
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

export namespace Popup {
  export type Props = PopupProps;

  export function create(children: React.ReactNode, onDismiss?: () => void) {
    const tainer = document.createElement("div");
    document.body.appendChild(tainer);

    const reactRoot = RDC.createRoot(tainer!);
    reactRoot.render(<Popup parentElement={tainer} onDismiss={onDismiss}>{children}</Popup>);
  }
}
