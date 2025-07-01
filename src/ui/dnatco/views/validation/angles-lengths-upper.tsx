import React from "react";
import { AnglesLengthsByCompound } from "./angles-lengths-by-compound";
import { AnglesLengthsByResidue } from "./angles-lengths-by-residue";
import { AnglesLengthsCommon } from "./angles-lengths-common";
import { ChainSelect, ModelSelect } from "../structure-selectors";
import { View } from "../view";
import { ComboBox } from "../../../common/combo-box";
import { NamedList, NamedListItem } from "../../../common/named-list";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";

export function AnglesLengthsUpper(props: View.Props) {
  const multipleModels = Dnatcofication.Structure.numberOfModels(props.dnatcofication) > 1;
  const numChains = props.dnatcofication.data.steps.chains[0].size;
  const [groupBy, setGroupBy] = React.useState("residue");

  return (
    <div className="overflow-hidden h-full flex flex-col">
      <NamedList sizing="min-content" rowSpacing="half">
        <NamedListItem name="List by">
          <ComboBox
            options={[
              { caption: "Individual residue", value: "residue" },
              { caption: "Nucleotide type", value: "compound" },
            ]}
            value={groupBy}
            onChange={(v) => setGroupBy(v)}
            sizing="auto"
          />
        </NamedListItem>
        {multipleModels && (
          <NamedListItem name="Model">
            <ModelSelect
              dnatcofication={props.dnatcofication}
              structureSelection={props.structureSelection}
              switching={props.switching}
            />
          </NamedListItem>
        )}
        {numChains > 1 && (
          <NamedListItem name="Chain">
            <ChainSelect
              dnatcofication={props.dnatcofication}
              structureSelection={props.structureSelection}
              switching={props.switching}
            />
          </NamedListItem>
        )}
      </NamedList>

      <div className="h-4" />

      {groupBy === "residue" ? (
        <AnglesLengthsByResidue {...props} />
      ) : (
        <AnglesLengthsByCompound {...props} />
      )}
    </div>
  );
}

export namespace AnglesLengthsUpper {
  export const SelectionDisplayer = AnglesLengthsCommon.SelectionDisplayer;
  export const SelectionMaker = AnglesLengthsCommon.SelectionMaker;
  export const unscrollableContainer = true;
}
