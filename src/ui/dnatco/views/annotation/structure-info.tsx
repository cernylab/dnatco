import * as React from "react";
import { EntitiesAndMolecules } from "./entities-and-molecules";
import { View } from "../view";
import { CollapsibleVertical } from "../../../common/collapsible-vertical";
import { Link } from "../../../common/link";
import { NamedList, NamedListItem } from "../../../common/named-list";
import { TriangleDownImg } from "../../../../assets/images";
import { Exptl } from "../../../../cif/categories/experimental";
import { PdbxDatabaseStatus } from "../../../../cif/categories/pdbx-database-status";
import { Refine } from "../../../../cif/categories/refine";
import { Struct } from "../../../../cif/categories/struct";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { doiLink, pubmedLink, rcsbLink } from "../../../../util/resources";
import { getCifValue, niceCifDate, Common } from "../../../../util/dnatco";
import {
  NdbStructNtcStep,
  NdbStructNtcStepSummary,
} from "../../../../cif/categories/ndb-struct-ntc";
import { Cif } from "../../../../cif";
import { Tooltip } from "../../../common/tooltip";
import { tooltipImg } from "../../../../assets/images";
import * as SI from "../../../../util/structure-info";

function mkHeader(text: string) {
  return {
    collapsed: (
      <div className="flex flex-row gap-2 rdo-taller cursor-pointer">
        <img
          src={TriangleDownImg}
          className="transition-transform duration-200 transform rotate-0"
        />
        <div className="font-700 flex-1">{text}</div>
      </div>
    ),
    expanded: (
      <div className="flex flex-row gap-2 rdo-taller cursor-pointer">
        <img
          src={TriangleDownImg}
          className="transition-transform duration-200 transform rotate-180"
        />
        <div className="font-700 flex-1">{text}</div>
      </div>
    ),
  };
}

function NucleotideCounts({ d }: { d: Dnatcofication }) {
  const counts = d.data.nucleotideCounts;

  if (counts.source !== 'unavailable') {
    const sourceInfo = counts.source === 'entity-poly'
      ? 'Read from entity_poly mmCif category'
      : 'Counted from model';

    const sortedCounts = Array.from(counts.counts.entries()).sort(([nA, _], [nB, __]) => {
      return (nA.length !== nB.length)
        ? nA.length - nB.length
        : nA.localeCompare(nB);
    });

    return (
      <table className="mb-2 w-full">
        <thead>
          <tr>
            <th
              colSpan={2}
              className="mb-4 p-4 text-18px border-primary-first border-[.1px]"
            >
              Counts of Nucleotide in polymer entity
              <div style={{ fontSize: '0.85rem', filter: 'saturate(66%)'}}>{sourceInfo}</div>
            </th>
          </tr>
          <tr>
            <th className="py-2 border-primary-first border-[.1px]">
              Nucleotide
            </th>
            <th className="py-2 border-primary-first border-[.1px]">Count</th>
          </tr>
        </thead>
        <tbody>
          {sortedCounts.map((x) => (
            <tr key={x[0]}>
              <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                {x[0]}
              </td>
              <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                {x[1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

function CountsOfNtC({ d }: { d: Dnatcofication }){
  const summary = d.table(NdbStructNtcStepSummary);
  const { assigned_NtC } = summary;
  const steps = d.table(NdbStructNtcStep);

  const ntCCounts: { [ntc: string]: number } = {};

  for (let row = 0; row < steps._rowCount; row++) {
    const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
    ntCCounts[assignedNtC] = (ntCCounts[assignedNtC] || 0) + 1;
  }

  return (
    <table className="mb-2 w-full">
      <thead>
        <tr>
          <th
            colSpan={2}
            className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
          >
            <div className="flex justify-center">
              <span>Counts of NtC</span>
              <Tooltip
                tag={
                  <div className="cursor-pointer ml-3">
                    <img className="w-5 my-auto" src={tooltipImg} />
                  </div>
                }
                delayMsec={300}
              >
                diNucleotide Conformational classes, for more see help (Link
                in footer)
              </Tooltip>
            </div>
          </th>
        </tr>
        <tr>
          <th className="py-2 border-primary-first border-[.1px]">NtC</th>
          <th className="py-2 border-primary-first border-[.1px]">Count</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(ntCCounts).map(([ntc, count]) => (
          <tr key={ntc}>
            <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
              {ntc}
            </td>
            <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
              {count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CountsOfCana({ d }: { d: Dnatcofication }) {
    const summary = d.table(NdbStructNtcStepSummary);
    const { assigned_CANA } = summary;
    const steps = d.table(NdbStructNtcStep);

    const canaCounts: { [ntc: string]: number } = {};

    for (let row = 0; row < steps._rowCount; row++) {
      const assignedCANA = Cif.Column.value(assigned_CANA, row)!;
      canaCounts[assignedCANA] = (canaCounts[assignedCANA] || 0) + 1;
    }

  return (
    <table className="mb-2 w-full">
      <thead>
        <tr>
          <th
            colSpan={2}
            className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
          >
            <div className="flex justify-center">
              <span>Counts of CANA</span>
              <Tooltip
                tag={
                  <div className="cursor-pointer ml-3">
                    <img className="w-5 my-auto" src={tooltipImg} />
                  </div>
                }
                delayMsec={300}
              >
                Conformational Alphabet of Nucleic Acids, for more see help
                (Link in footer)
              </Tooltip>
            </div>
          </th>
        </tr>
        <tr>
          <th className="py-2 border-primary-first border-[.1px]">CANA</th>
          <th className="py-2 border-primary-first border-[.1px]">Count</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(canaCounts).map(([cana, count]) => (
          <tr key={cana}>
            <td className="font-bold border-r-[.1px] py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
              {cana}
            </td>
            <td className="font-bold border-primary-first py-1 px-7 border-[.1px] w-[7rem] text-center">
              {count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function structureId(d: Dnatcofication) {
  const id = getCifValue(d, Struct, "entry_id");
  if (!id) return Common.NA;

  return (
    <div>
      {id.toUpperCase()}
      {"\u00A0"}
      <Link className="text-primary-first" url={rcsbLink(id)} newTab={true}>
        (Link to PDB)
      </Link>
    </div>
  );
}

export class StructureInfo extends View {
  render() {
    const priPub = SI.primaryPublication(this.props.dnatcofication);
    const pubmedHref = priPub?.pdbx_database_id_PubMed ? (
      <Link url={pubmedLink(priPub.pdbx_database_id_PubMed)} newTab={true}>
        {priPub.pdbx_database_id_PubMed}
      </Link>
    ) : (
      Common.NA
    );
    const doiHref = priPub?.pdbx_database_id_DOI ? (
      <Link url={doiLink(priPub.pdbx_database_id_DOI)} newTab={true}>
        {priPub.pdbx_database_id_DOI}
      </Link>
    ) : (
      Common.NA
    );

    return (
      <div>
        <NamedList>
          <NamedListItem name="Structure ID">
            {structureId(this.props.dnatcofication)}
          </NamedListItem>
          <NamedListItem name="Structure title">
            {getCifValue(this.props.dnatcofication, Struct, "title") ??
              Common.NA}
          </NamedListItem>
          <NamedListItem name="Deposited to PDB">
            {niceCifDate(
              getCifValue(
                this.props.dnatcofication,
                PdbxDatabaseStatus,
                "recvd_initial_deposition_date"
              )
            )}
          </NamedListItem>
        </NamedList>
        <div className="h-4" />
        <CollapsibleVertical header={mkHeader("Entities")}>
          <div className="rdo-offset">
            <EntitiesAndMolecules d={this.props.dnatcofication} />
          </div>
        </CollapsibleVertical>
        <CollapsibleVertical header={mkHeader("Literature")}>
          <div className="rdo-offset">
            <NamedList>
              <NamedListItem name="Publication title">
                {priPub?.title ?? Common.NA}
              </NamedListItem>
              <NamedListItem name="Authors">
                {SI.listAuthors(this.props.dnatcofication)}
              </NamedListItem>
              <NamedListItem name="PubMed">{pubmedHref}</NamedListItem>
              <NamedListItem name="DOI">{doiHref}</NamedListItem>
            </NamedList>
          </div>
        </CollapsibleVertical>
        <CollapsibleVertical header={mkHeader("Experimental")}>
          <div className="rdo-offset">
            <NamedList>
              <NamedListItem name="Method">
                {getCifValue(this.props.dnatcofication, Exptl, "method") ??
                  Common.NA}
              </NamedListItem>
              <NamedListItem name="Resolution">
                {SI.resolution(this.props.dnatcofication)}
              </NamedListItem>
              <NamedListItem name="R-free">
                {getCifValue(
                  this.props.dnatcofication,
                  Refine,
                  "ls_R_factor_R_free"
                )?.toFixed(3) ?? Common.NA}
              </NamedListItem>
            </NamedList>
          </div>
        </CollapsibleVertical>
        <CollapsibleVertical header={mkHeader("Main features")}>
          <div className="w-1/2 mx-4 my-2">
            <CountsOfNtC d={this.props.dnatcofication} />
            <CountsOfCana d={this.props.dnatcofication} />
            <NucleotideCounts d={this.props.dnatcofication} />
          </div>
        </CollapsibleVertical>
      </div>
    );
  }
}

export namespace StructureInfo {
  export const StepSwitcher = () => {};
}
