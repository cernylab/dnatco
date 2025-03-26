import type { StandardLonghandProperties } from "csstype";
import React from "react";

export class BasePushButton<
  P extends BasePushButton.Props
> extends React.Component<P> {
  static defaultProps = {
    disabled: false,
  };

  protected clsName() {
    if (!this.props.disabled) return this.props.className ?? "";
    else return this.props.classNameDisabled ?? "";
  }

  render() {
    return (
      <div
        className={this.clsName()}
        style={this.props.style}
        onClick={(e: React.MouseEvent<HTMLInputElement>) => {
          if (!this.props.disabled && this.props.onClick) this.props.onClick(e);
        }}
        onMouseDown={(e) => {
          if (!this.props.disabled && this.props.onMouseDown)
            this.props.onMouseDown(e);
        }}
        onMouseUp={(e) => {
          if (!this.props.disabled && this.props.onMouseUp)
            this.props.onMouseUp(e);
        }}
        onMouseEnter={(e) => {
          if (!this.props.disabled && this.props.onMouseEnter)
            this.props.onMouseEnter(e);
        }}
        onMouseLeave={(e) => {
          if (!this.props.disabled && this.props.onMouseLeave)
            this.props.onMouseLeave(e);
        }}
      >
        {this.props.children}
      </div>
    );
  }
}

export class DummyButton extends React.Component<
  Omit<PushButton.Props, "onClick">
> {
  static defaultProps = {
    disabled: false,
  };

  protected clsName() {
    if (!this.props.disabled) return this.props.className ?? "rdo-pushbutton";
    else return this.props.classNameDisabled ?? "rdo-pushbutton-disabled";
  }

  render() {
    return (
      <div className={this.clsName()}>
        <div className="font-700 text-16px m-1">{this.props.caption}</div>
      </div>
    );
  }
}

export class DummyIconTextButton extends React.Component<
  Omit<IconTextButton.Props, "onClick">
> {
  static defaultProps = {
    disabled: false,
  };

  protected clsName() {
    if (!this.props.disabled)
      return (
        this.props.className ??
        "items-center flex justify-center p-2 bg-primary-first rounded-standard text-white hover:text-primary-first transition-all hover:bg-secondary-second"
      );
    else return this.props.classNameDisabled ?? "rdo-pushbutton-disabled";
  }

  render() {
    return (
      <div className={this.clsName()}>
        <div className="rdo-pushbutton-inner-container flex items-center gap-1 h-full justify-center m-auto mx-1">
          <span className="font-700 text-16px m-1">{this.props.caption}</span>
        </div>
      </div>
    );
  }
}

export class IconButton extends React.Component<IconButton.Props> {
  static defaultProps = {
    disabled: false,
  };

  render() {
    return (
      <BasePushButton
        {...this.props}
        className={this.props.className ?? "rdo-icon-button"}
        classNameDisabled={
          this.props.classNameDisabled ?? "rdo-icon-button-disabled"
        }
      >
        <div className="rdo-pushbutton-inner-container flex items-center gap-1 h-full justify-center m-auto mx-1">
          <img
            className={this.props.iconClassName ?? "rdo-icon-button-image"}
            src={this.props.src}
          />
        </div>
      </BasePushButton>
    );
  }
}

export class IconTextButton extends React.Component<IconTextButton.Props> {
  static defaultProps = {
    disabled: false,
  };

  protected clsName() {
    if (!this.props.disabled) return this.props.className ?? "rdo-pushbutton";
    else return this.props.classNameDisabled ?? "rdo-pushbutton-disabled";
  }

  render() {
    return (
      <BasePushButton
        {...this.props}
        className={
          this.props.className ??
          "rdo-icon-text-button bg-primary-first text-white rounded-standard hover:text-primary-first cursor-pointer"
        }
        classNameDisabled={
          this.props.classNameDisabled ?? "rdo-icon-text-button-disabled"
        }
      >
        <div className="rdo-pushbutton-inner-container flex items-center gap-1 h-full justify-center m-auto mx-1 p-1">
          <span className="font-700 text-16px m-1">{this.props.caption}</span>
        </div>
      </BasePushButton>
    );
  }
}

export class PushButton extends BasePushButton<PushButton.Props> {
  static defaultProps = {
    disabled: false,
  };

  protected clsName() {
    if (!this.props.disabled)
      return (
        this.props.className ??
        "bg-primary-first items-center flex justify-center px-4 py-1 cursor-pointer w-fit rounded-standard hover:bg-secondary-second text-white hover:text-primary-first transition-all"
      );
    else return this.props.classNameDisabled ?? "rdo-pushbutton-disabled";
  }

  render() {
    return (
      <div
        className={this.clsName()}
        onClick={(e: React.MouseEvent<HTMLInputElement>) => {
          if (!this.props.disabled && this.props.onClick) this.props.onClick(e);
        }}
        onMouseDown={(e) => {
          if (!this.props.disabled && this.props.onMouseDown)
            this.props.onMouseDown(e);
        }}
        onMouseUp={(e) => {
          if (!this.props.disabled && this.props.onMouseUp)
            this.props.onMouseUp(e);
        }}
        onMouseEnter={(e) => {
          if (!this.props.disabled && this.props.onMouseEnter)
            this.props.onMouseEnter(e);
        }}
        onMouseLeave={(e) => {
          if (!this.props.disabled && this.props.onMouseLeave)
            this.props.onMouseLeave(e);
        }}
      >
        <div className="font-700 text-16px m-1">{this.props.caption}</div>
      </div>
    );
  }
}

export class ToggleButton extends BasePushButton<ToggleButton.Props> {
  static defaultProps = {
    disabled: false,
  };

  protected clsName() {
    if (!this.props.disabled)
      return (
        this.props.className ??
        `rdo-pushbutton ${
          this.props.selected
            ? "rdo-togglebutton-selected"
            : "rdo-togglebutton-deselected"
        }`
      );
    else return this.props.classNameDisabled ?? "rdo-pushbutton-disabled";
  }

  render() {
    return (
      <div
        className={this.clsName()}
        onClick={(e: React.MouseEvent<HTMLInputElement>) => {
          if (!this.props.disabled && this.props.onClick) this.props.onClick(e);
        }}
        onMouseDown={(e) => {
          if (!this.props.disabled && this.props.onMouseDown)
            this.props.onMouseDown(e);
        }}
        onMouseUp={(e) => {
          if (!this.props.disabled && this.props.onMouseUp)
            this.props.onMouseUp(e);
        }}
        onMouseEnter={(e) => {
          if (!this.props.disabled && this.props.onMouseEnter)
            this.props.onMouseEnter(e);
        }}
        onMouseLeave={(e) => {
          if (!this.props.disabled && this.props.onMouseLeave)
            this.props.onMouseLeave(e);
        }}
      >
        <div className="font-700 text-16px m-1">{this.props.caption}</div>
      </div>
    );
  }
}

export namespace BasePushButton {
  export interface Props {
    disabled: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    onMouseUp?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    className?: string;
    classNameDisabled?: string;
    children?: React.ReactNode;
    style?: StandardLonghandProperties;
  }
}

export namespace IconButton {
  export interface Props extends BasePushButton.Props {
    src: string;
    iconClassName?: string;
  }
}

export namespace IconTextButton {
  export interface Props extends BasePushButton.Props {
    src: string;
    iconClassName?: string;
    caption: string;
  }
}

export namespace PushButton {
  export interface Props extends BasePushButton.Props {
    caption: string;
  }
}

export namespace ToggleButton {
  export interface Props extends BasePushButton.Props {
    caption: string;
    selected: boolean;
  }
}
