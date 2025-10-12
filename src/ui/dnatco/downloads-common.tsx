import React from "react";
import { EquiBox } from "../common/equibox";
import { Net } from "../../browser-util/net";
import { Cif } from "../../cif";
import { Struct } from "../../cif/categories/struct";
import {
  NdbStructNtcStep,
  NdbStructNtcStepSummary,
} from "../../cif/categories/ndb-struct-ntc";
import { Dnatcofication } from "../../dnatco/dnatcofication";

export namespace Downloads {
  function mmCifName(d: Dnatcofication) {
    if (!d.hasTable(Struct)) return "dnatco_structure.cif";
    const col = d.table(Struct).entry_id;
    const entryId = Cif.Column.value(col, 0);
    return `${entryId}.cif`;
  }

  export function DownloadBox(props: {
    children: JSX.Element[] | JSX.Element;
  }) {
    return (
      <div className="flex items-center flex-row h-8">
        <EquiBox padding={0} orientation="row" gap="0.5em">
          {props.children}
        </EquiBox>
        <div className="flex-1" />
      </div>
    );
  }

  export function Title(props: { title: string }) {
    return (
      <div className="flex flex-row gap-4">
        <div className="font-700 text-18px mb-2 uppercase">{props.title}</div>
      </div>
    );
  }

  export function assignmentTable(
    d: Dnatcofication,
    includeConfalsAndRmsds: boolean
  ) {
    const steps = d.table(NdbStructNtcStep);
    const summary = d.table(NdbStructNtcStepSummary);
    const { label_asym_id_1, name } = steps;
    const {
      assigned_NtC,
      closest_NtC,
      assigned_CANA,
      closest_CANA,
      confal_score,
      cartesian_rmsd_closest_NtC_representative,
    } = summary;

    const chainColumn = {
      name: "Chain",
      values: label_asym_id_1.values!.map((x) => x),
    };
    const stepColumn = {
      name: "Step",
      values: name.values!.map((x) => x),
    };
    const assignedNtCColumn = {
      name: "Assigned NtC",
      values: assigned_NtC.values!.map((x) => x),
    };
    const closestNtCColumn = {
      name: "Closest NtC",
      values: closest_NtC.values!.map((x) => x),
    };
    const assignedCanaColumn = {
      name: "Assigned CANA",
      values: assigned_CANA.values!.map((x) => x),
    };
    const closestCanaColumn = {
      name: "Closest CANA",
      values: closest_CANA.values!.map((x) => x),
    };
    const confalScoreColumn = {
      name: "CS",
      values: confal_score.values!.map((x) => x.toString()),
    };
    const rmsdColumn = {
      name: "RMSD",
      values: cartesian_rmsd_closest_NtC_representative.values!.map((x) =>
        x.toString()
      ),
    };

    const columns = [
      chainColumn,
      stepColumn,
      assignedNtCColumn,
      closestNtCColumn,
      assignedCanaColumn,
      closestCanaColumn,
    ];
    if (includeConfalsAndRmsds) columns.push(confalScoreColumn, rmsdColumn);

    return columns;
  }

  export function serveMmCif(d: Dnatcofication) {
    const filename = mmCifName(d);
    Net.serveFile("chemical/x-mmcif", d.rawCif(), filename);
  }
}
