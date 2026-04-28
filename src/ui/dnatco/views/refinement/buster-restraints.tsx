import React from "react";
import { Refinement } from "./common";
import { View } from "../view";
import { PushButton } from "../../../common/push-button";
import { SpinBox } from "../../../common/spin-box";
import { Net } from "../../../../browser-util/net";
import { Buster } from "../../../../refine/buster";
import {RadixComboBox} from "../../../common/radix-combo-box";

interface State {
  maxRmsd: number;
}
export class BusterRestraints extends View<Refinement.Props, State> {
  constructor(props: Refinement.Props) {
    super(props);

    this.state = {
      maxRmsd: 0.5,
    };
  }

  render() {
    const restraints = Buster.restraints(
      this.props.dnatcofication,
      this.props.selectedCustomNtCSet,
      this.state.maxRmsd
    );
    const elems = new Array<JSX.Element>();

    let ctr = 0;
    for (const r of restraints) {
      if (r.rtype === "unavailable")
        elems.push(
          <div className="text-secondary-third" key={ctr}>
            {Buster.restraintAsText(r)}
          </div>
        );
      else elems.push(<div key={ctr}>{Buster.restraintAsText(r)}</div>);

      ctr++;
    }

    return (
      <div className="overflow-hidden h-full flex flex-col">
        <div>
          <div className="rdo-secondary-caption">Restraints for Buster</div>
          <div className="items-center grid gap-4 [grid-template-columns:auto_auto_auto_auto_auto] justify-center">
            <div>NtC set:</div>
            <RadixComboBox
              options={Refinement.ntcSetsOptions(
                this.props.dnatcofication.customNtCs
              )}
              value={this.props.selectedCustomNtCSet || 'default_value'}
              onChange={(v) => {
                const finalNtCChange = v == "default_value" ? "" : v;
                this.props.onCustomNtCSetChanged(finalNtCChange);  }}
              triggerAddStyle={"min-w-[120px] flex-shrink-0 items-center px-2 height-inherit"}
            />
            <div>Maximum allowed RMSD:</div>
            <SpinBox
              value={this.state.maxRmsd}
              min={0.1}
              max={5.0}
              onChange={(v) => this.setState({ ...this.state, maxRmsd: v })}
              step={0.01}
              formatter={(v) => v?.toFixed(2) ?? "0"}
            />
            <PushButton
              caption="Download"
              onClick={() => {
                const text = Buster.restraintsAsText(restraints);
                Net.serveFile(
                  "text/plain",
                  text,
                  `${this.props.dnatcofication.identifyingName}_Buster_geometry_restraints.txt`
                );
              }}
            />
          </div>
        </div>
        <div className="rdo-offset overflow-scroll flex-1">{elems}</div>
      </div>
    );
  }
}

export namespace BusterRestraints {
  export const StepSwitcher = () => {};
}
