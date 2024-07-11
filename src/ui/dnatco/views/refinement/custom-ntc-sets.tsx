import React from "react";
import { Refinement } from "./common";
import { ComboBox } from "../../../common/combo-box";
import { InputDialog } from "../../../common/input-dialog";
import { IconTextButton } from "../../../common/push-button";
import { WithSubscriptions } from "../../../service/with-subscriptions";
import { PlusImg, ReloadImg, XImg } from "../../../../assets/images";
import { CustomNtCs } from "../../../../dnatco/custom-ntcs";
import { Empty } from "../../../../util/types";

export class CustomNtCSets extends WithSubscriptions<
  CustomNtCSets.Props,
  Empty
> {
  constructor(props: CustomNtCSets.Props) {
    super(props);
  }

  componentDidMount() {
    this.subscribe(this.props.customNtCs.events.setAdded, () =>
      this.forceUpdate()
    );
    this.subscribe(this.props.customNtCs.events.setDeleted, () =>
      this.forceUpdate()
    );
    this.subscribe(this.props.customNtCs.events.setRenamed, () =>
      this.forceUpdate()
    );
    this.subscribe(this.props.customNtCs.events.setsCleared, () =>
      this.forceUpdate()
    );
  }

  componentWillUnmount() {
    this.unsubscribeAll();
  }

  render() {
    return (
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto 6em 6em 6em 1fr",
            gap: "0.5em",
            alignItems: "center",
          }}
        >
          <div className="rdo-named-list-name">Sets of custom NtC</div>
          <ComboBox
            options={Refinement.ntcSetsOptions(this.props.customNtCs)}
            value={this.props.selectedSet}
            onChange={(v) => this.props.onSetChanged(v)}
          />
          <IconTextButton
            caption="Add"
            src={PlusImg}
            onClick={() => {
              InputDialog.create({
                caption: "Name of the new set",
                validator: (v) => {
                  if (v === "") return "Set must have a name";
                  return this.props.customNtCs.exists(v)
                    ? `Set named ${v} already exists`
                    : void 0;
                },
                onAccepted: (v) => {
                  this.props.customNtCs.addSet(v);
                  this.props.onSetChanged(v);
                },
              });
            }}
          />
          <IconTextButton
            caption="Rename"
            src={ReloadImg}
            onClick={() => {
              InputDialog.create({
                caption: `Set new name for set ${this.props.selectedSet}`,
                validator: (v) => {
                  if (v === "") return "Set must have a name";
                  return this.props.customNtCs.exists(v)
                    ? `Set named ${v} already exists`
                    : void 0;
                },
                onAccepted: (v) => {
                  this.props.customNtCs.renameSet(this.props.selectedSet, v);
                  this.props.onSetChanged(v);
                },
              });
            }}
          />
          <IconTextButton
            caption="Delete"
            src={XImg}
            onClick={() => {
              if (this.props.selectedSet !== "") {
                this.props.customNtCs.deleteSet(this.props.selectedSet);
              }
            }}
          />
        </div>
        {this.props.selectedSet === "" ? (
          <div
            style={{
              fontStyle: "oblique",
              color: "var(--color-f)",
              height: "1em",
              marginTop: "calc(var(--v-gap) / 2)",
            }}
          >
            (Add your own NtC sets if you want to change the automatically
            assigned NtCs)
          </div>
        ) : (
          <div style={{ height: "1em", marginTop: "calc(var(--v-gap) / 2)" }} />
        )}
      </div>
    );
  }
}

export namespace CustomNtCSets {
  export interface Props {
    customNtCs: CustomNtCs;
    selectedSet: string;
    onSetChanged: (set: string) => void;
  }
}
