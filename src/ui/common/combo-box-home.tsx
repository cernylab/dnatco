import { type StandardLonghandProperties } from "csstype";
import React from "react";
import { DownArrowImg } from "../../assets/images";

const SizingPolicy = {
  "min-content": "min-content",
  "maximum-available": "100%",
  auto: "auto",
};

const DropdownArrowStyle = {
  backgroundRepeat: "no-repeat",
  backgroundImage: `url("${DownArrowImg}")`,
  backgroundPosition: "right",
  backgroundSize: "1em",
};

export class ComboBoxHome extends React.Component<ComboBox.Props> {
  static defaultProps = {
    disabled: false,
    theme: "dark",
  };

  private selRef = React.createRef<HTMLSelectElement>();

  constructor(props: ComboBox.Props) {
    super(props);
  }

  private containerClass() {
    return this.props.disabled
      ? "flex justify-center relative rounded-standart p-4 bg-primary-first text-secondary-third"
      : "flex justify-center relative rounded-standart p-4 bg-primary-first";
  }

  onWheelEvent = (ev: WheelEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    const numOpts = this.props.options.length;
    if (numOpts < 1 || this.props.disabled) return;

    const y = ev.deltaY;
    const direction = y > 0 ? "down" : y < 0 ? "up" : "none";

    const idx = this.props.options.findIndex(
      (x) => x.value === this.props.value
    );
    if (idx < 0) return; // Should never happen

    if (direction === "down" && idx < numOpts - 1)
      this.props.onChange(this.props.options[idx + 1].value);
    else if (direction === "up" && idx > 0)
      this.props.onChange(this.props.options[idx - 1].value);
  };

  componentDidMount() {
    const sel = this.selRef.current;
    if (!sel) return;

    sel.addEventListener("wheel", this.onWheelEvent);
  }

  componentWillUnmount(): void {
    const sel = this.selRef.current;
    if (sel) sel.removeEventListener("wheel", this.onWheelEvent);
  }

  render() {
    return (
      <div className={this.containerClass()}>
        <select
          ref={this.selRef}
          className={`${
            this.props.theme === "light" ? "text-primary-first" : "text-white"
          } rdo-combobox`}
          value={this.props.value}
          onChange={(e) => this.props.onChange(e.currentTarget.value)}
          style={{ ...DropdownArrowStyle }}
          disabled={this.props.disabled}
        >
          {this.props.options.map((o) => {
            return (
              <option key={o.value} value={o.value}>
                {o.caption}
                {"\u00A0\u00A0"}
              </option>
            );
          })}
        </select>
      </div>
    );
  }
}

export namespace ComboBox {
  export type Option = {
    value: string;
    caption: string;
  };

  export interface Props {
    disabled: boolean;
    options: Option[];
    onChange: (v: string) => void;
    value: string;
    sizing?: keyof typeof SizingPolicy;
    innerStyle?: StandardLonghandProperties;
    theme?: "light" | "dark";
  }
}
