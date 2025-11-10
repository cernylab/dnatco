import React from "react";
import * as RDC from "react-dom/client";
import { PushButton } from "./push-button";

interface Props extends QuestionDialog.Props {
  parentElement: HTMLElement;
}
export class QuestionDialog extends React.Component<Props> {
  private dismiss() {
    document.body.removeChild(this.props.parentElement);
  }

  render() {
    return (
      <div className="rdo-popup absolute top-0 left-0 bg-test w-screen h-screen z-999">
        <div className="rdo-popup-inner absolute top-[40%] left-[30%] right-[30%] bg-primary-first p-6 rounded-standard">
          <div className="rdo-named-list-name text-white text-xl font-bold mb-4">{this.props.caption}</div>

          {typeof this.props.text === "string" ? (
            <div className="text-white mb-6">{this.props.text}</div>
          ) : (
            <div className="text-white mb-6">{this.props.text}</div>
          )}

          <div className="rdo-popup-button-bar flex gap-4 justify-end">
            {this.props.answers.map((x, idx) => {
              return (
                <PushButton
                  key={idx}
                  caption={x.text}
                  onClick={() => {
                    this.dismiss();
                    this.props.onAnswered(x.code);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export namespace QuestionDialog {
  export interface Props {
    caption: string;
    text: string | JSX.Element;
    answers: { text: string; code: number }[];
    onAnswered: (code: number) => void;
  }

  export function create(props: Props) {
    const tainer = document.createElement("div");
    document.body.appendChild(tainer);

    const reactRoot = RDC.createRoot(tainer!);
    reactRoot.render(<QuestionDialog {...props} parentElement={tainer} />);
  }
}
