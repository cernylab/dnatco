import React from "react";
import { Refinement } from "./common";
import { View } from "../view";
import { CheckBox } from "../../../common/check-box";
import { PushButton } from "../../../common/push-button";
import { Net } from "../../../../browser-util/net";
import { Mmb } from "../../../../refine/mmb";
import {RadixComboBox} from "../../../common/radix-combo-box";

interface State {
  includeSequences: boolean;
}
export class MmbCommandsFile extends View<Refinement.Props, State> {
  constructor(props: Refinement.Props) {
    super(props);

    this.state = {
      includeSequences: false,
    };
  }
  render() {
    const lines = Mmb.commands(
      this.props.dnatcofication,
      this.props.selectedCustomNtCSet,
      this.state.includeSequences
    );

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div>
          <div className="rdo-secondary-caption">MMB commands file</div>

          <div className="flex justify-center">
            Note that this is not a complete MMB commands file but just an
            excerpt that instructs MMB to apply NtCs to the structure
          </div>

          <div className="h-4" />

          <div className="grid gap-4 justify-center items-center grid-cols-auto-4">
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
            <CheckBox
              caption="Add sequence definitions to the commands file"
              checked={this.state.includeSequences}
              onChanged={(checked) =>
                this.setState({ ...this.state, includeSequences: checked })
              }
            />
            <PushButton
              caption="Download"
              onClick={() => {
                Net.serveFile(
                  "text/plain",
                  lines.join("\n"),
                  `${this.props.dnatcofication.identifyingName}_MMB_commands.txt`
                );
              }}
            />
          </div>
        </div>
        <div className="rdo-scroll-vertically-with-scrollbar">
          {lines.map((l, idx) => (
            <div key={idx}>{l}</div>
          ))}
        </div>
      </div>
    );
  }
}
