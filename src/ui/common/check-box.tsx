import React from "react";
import { v4 as uuidv4 } from "uuid";

export class CheckBox extends React.Component<CheckBox.Props> {
  private readonly tag: string;

  constructor(props: CheckBox.Props) {
    super(props);

    this.tag = uuidv4();
  }

  render() {
    return (
      <div className="rdo-input-checkbox-tainer flex flex-row items-center">
        <input
          className={`rdo-input-checkbox ${
            this.props.disabled ? "rdo-input-checkbox-disabled" : ""
          }`}
          type="checkbox"
          checked={this.props.checked}
          id={this.tag}
          onChange={(evt) => {
            if (!this.props.disabled)
              this.props.onChanged(evt.currentTarget.checked);
          }}
        />
        {this.props.caption ? (
          <label htmlFor={this.tag} style={{ whiteSpace: "nowrap" }}>
            {this.props.caption}
          </label>
        ) : (
          <></>
        )}
      </div>
    );
  }
}

export namespace CheckBox {
  export interface Props {
    checked: boolean;
    onChanged: (checked: boolean) => void;
    caption?: string;
    disabled?: boolean;
  }
}
