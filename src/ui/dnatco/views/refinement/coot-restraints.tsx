import React from "react";
import { Refinement } from "./common";
import { View } from "../view";
import { ComboBox } from "../../../common/combo-box";
import { PushButton } from "../../../common/push-button";
import { SpinBox } from "../../../common/spin-box";
import { Net } from "../../../../browser-util/net";
import { Coot } from "../../../../refine/coot";

interface State {
  maxRmsd: number;
}
export class CootRestraints extends View<Refinement.Props, State> {
  constructor(props: Refinement.Props) {
    super(props);

    this.state = {
      maxRmsd: 0.5,
    };
  }

  render() {
    const restraints = Coot.restraints(
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
            {Coot.restraintAsText(r)}
          </div>
        );
      else elems.push(<div key={ctr}>{Coot.restraintAsText(r)}</div>);

      ctr++;
    }

    return (
      <div className="overflow-hidden h-full flex flex-col">
        <div>
          <div className="rdo-secondary-caption">Restraints for COOT</div>
          <div className="items-center grid gap-4 [grid-template-columns:auto_auto_auto_auto_auto] justify-center">
            <div>NtC set:</div>
            <ComboBox
              options={Refinement.ntcSetsOptions(
                this.props.dnatcofication.customNtCs
              )}
              value={this.props.selectedCustomNtCSet}
              onChange={(v) => this.props.onCustomNtCSetChanged(v)}
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
                const text = Coot.restraintsAsText(restraints);
                Net.serveFile(
                  "text/plain",
                  text,
                  `${this.props.dnatcofication.identifyingName}_COOT_geometry_restraints.txt`
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

export namespace CootRestraints {
  export const StepSwitcher = () => {};
}
