import React from "react";
import { ComboBox } from "./common/combo-box";
import { DummyIconTextButton, IconTextButton } from "./common/push-button";
import { Popup } from "./common/popup";
import { Tooltip } from "./common/tooltip";
import {
  MagnifyingGlassImg,
  MediaPlayImg,
  DnaLeft,
  DnaRight,
  Density,
  NavalAform,
  Contacts,
} from "../assets/images";
import { DensityMap, DensityMapKinds } from "../dnatco/density-map";
import { Logger } from "../log/logger";
import {
  BuiltInRemoteDatabases,
  UserRemoteDatabases,
} from "../remote/db/register";
import { copyString, isPdbId, toPdbId } from "../util";
import { GlobalConfig, GlobalConfigData } from "../global-config";
import { ComboBoxHome } from "./common/combo-box-home";

const AllowedDensityMapKinds = [...DensityMapKinds, "coefficients"] as const;
type AllowedDensityMapKinds = (typeof AllowedDensityMapKinds)[number];
type DensityMapFile = { file: File; kind: AllowedDensityMapKinds };

function listOfValidExamples(examples: GlobalConfigData["exampleStructures"]) {
  const dbIds = UserRemoteDatabases.list().map((x) => x.id);

  for (const id in BuiltInRemoteDatabases) {
    dbIds.push(id);
  }

  const valid = new Array<GlobalConfigData["exampleStructures"][0]>();
  for (const ex of examples) {
    if (dbIds.includes(ex.db) && isPdbId(ex.pdbId, true)) valid.push(ex);
    else
      Logger.log(
        Logger.Severity.Warning,
        `Example structure entry "${ex.pdbId}" from DB "${ex.db}" is invalid. Check the PDB ID is valid and that it references a valid database.`
      );
  }

  return valid;
}

function makeExample(
  db: string,
  pdbId: string,
  name: string | undefined,
  handler: (db: string, pdbId: string) => void
) {
  const _db = copyString(db);
  const _pdbId = copyString(pdbId);
  return (
    <div
      key={`${_db}${_pdbId}`}
      className="rdo-example-structure cursor-pointer text-14px mx-1 p-3 bg-primary-first rounded-standard text-secondary-first hover:text-primary-first transition-all hover:bg-secondary-second"
      onClick={() => handler(_db, _pdbId)}
    >
      {name ?? _pdbId}
    </div>
  );
}

const NiceMapKinds: Record<AllowedDensityMapKinds, string> = {
  "fo-fc": "Fo-Fc",
  "2fo-fc": "2Fo-Fc",
  em: "EM",
  coefficients: "Map coefficients",
};

class AnalyzeButton extends React.Component<{
  ready: boolean;
  onClick: () => void;
}> {
  render() {
    return (
      <IconTextButton
        src={MediaPlayImg}
        caption="Analyze"
        onClick={() => this.props.onClick()}
        disabled={!this.props.ready}
        className="items-center flex justify-center cursor-pointer transition-all ease-in-out w-full bg-primary-first text-16px text-secondary-first rounded-standard p-2 hover:bg-secondary-second"
        classNameDisabled="items-center flex justify-center rounded-standard w-full p-2 text-16px bg-primary-first-disabled text-white"
      />
    );
  }
}

class Coordinates extends React.Component<Coordinates.Props> {
  render() {
    const customFile = !this.props.database;
    const examples = listOfValidExamples(GlobalConfig.data().exampleStructures);

    return (
      <div className="mx-auto">
        <div className="text-39px text-center tracking-wider mb-2">
          Analyze your structure
        </div>
        {examples.length > 0 ? (
          <div className="mx-auto mb-4 flex flex-row w-fit">
            <div className="font-700 m-auto mr-2">Examples:</div>
            <div className="flex flex-row flex-wrap">
              {examples.map((x) =>
                makeExample(x.db, x.pdbId, x.name, this.props.onRunExample)
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-2 flex flex-row w-fit" />
        )}
        <div className="flex flex-col w-[430px] m-auto">
          <div className="flex mb-2">
            <div className="text-20px text-primary-first w-[155px] my-auto">
              Select
            </div>
            <div className="w-300px rounded-standard">
              <ComboBoxHome
                value={this.props.database}
                options={this.props.databaseOptions}
                onChange={(db) => this.props.onDatabaseChange(db)}
              />
            </div>
          </div>

          {customFile ? (
            <>
              <div className="text-center w-full p-1 px-3 text-13px font-roboto-bold bg-secondary-second text-primary-first rounded-standard mb-2">
                We advise to check your file by{" "}
                <a
                  className="hover:text-secondary-third underline"
                  href="https://sw-tools.rcsb.org/apps/MAXIT/index.html"
                  target="_blank"
                >
                  MAXIT
                </a>{" "}
                before uploading. Only CCP4 and DSN6 files are currently
                supported.
              </div>
              <div className="flex">
                <div className="flex flex-col mb-2">
                  <div className="flex">
                    <div className="text-20px w-[147px] my-auto">
                      Coordinates
                    </div>
                    <label
                      htmlFor="upload-coords-file"
                      className="flex justify-end h-full"
                    >
                      <div className="w-[8.6rem]">
                        <DummyIconTextButton
                          src={MagnifyingGlassImg}
                          caption="Browse"
                        />
                      </div>
                    </label>
                    <FileInput
                      id="upload-coords-file"
                      onChange={(fileList) => {
                        const file = fileList ? fileList.item(0) : null;
                        if (file) this.props.onCoordsFileChange(file);
                      }}
                    />
                  </div>
                </div>
                {this.props.coordsFile ? (
                  <LongFileName
                    name={this.props.coordsFile.name}
                    disabled={false}
                  />
                ) : (
                  <></>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex">
                <div className="text-20px text-primary-first w-[155px] my-auto">
                  PDB ID
                </div>
                <div className="w-300px rounded-standard">
                  <PdbIdInput
                    pdbId={this.props.pdbId}
                    onChange={(v) => this.props.onPdbIdChange(v)}
                    onExecute={() => this.props.onRun()}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
namespace Coordinates {
  export interface Props {
    coordsFile: File | null;
    database: string;
    databaseOptions: ComboBox.Option[];
    pdbId: string;

    onCoordsFileChange: (file: File) => void;
    onDatabaseChange: (db: string) => void;
    onPdbIdChange: (id: string) => void;

    onRun: () => void;
    onRunExample: (db: string, pdbId: string) => void;
  }
}

class DensityMapFiles extends React.Component<
  DensityMapFiles.Props,
  {
    inputs: {
      selectedKind: AllowedDensityMapKinds;
      selectedFile: File | null;
    }[];
    openModal: boolean;
    selectedFileNames: Set<string>;
    showMessage: boolean;
    message: string;
  }
> {
  constructor(props: DensityMapFiles.Props) {
    super(props);

    this.state = {
      inputs: [{ selectedKind: "2fo-fc", selectedFile: null }],
      openModal: false,
      selectedFileNames: new Set(),
      showMessage: false,
      message: "",
    };
  }

  private fileTypeOptions() {
    return AllowedDensityMapKinds.map((x) => ({
      caption: NiceMapKinds[x],
      value: x,
    }));
  }

  public handleAddFile() {
    console.log("handleAddFile was called");
    try {
      const { inputs } = this.state;
      console.log("Processing inputs:", inputs.map(i => ({ file: i.selectedFile?.name, kind: i.selectedKind })));

      inputs.forEach(({ selectedFile, selectedKind }) => {
        if (selectedFile) {
          console.log(`Adding file: ${selectedFile.name} with kind: ${selectedKind}`);
          const df: DensityMapFile = { file: selectedFile, kind: selectedKind };
          this.props.onAddFile(df);
          console.log(`Successfully added file: ${selectedFile.name}`);
        }
      });

      console.log("handleAddFile completed successfully");
    } catch (e) {
      console.error("Error adding files:", e);
      Popup.create(
        <div className="text-secondary-third">
          Error adding files: {e instanceof Error ? e.message : String(e)}
        </div>
      );
      throw e; // Re-throw so actionCustomStructure can also handle it
    }
  }

  private addInput = () => {
    this.setState((prevState) => ({
      inputs: [
        ...prevState.inputs,
        { selectedKind: "2fo-fc", selectedFile: null },
      ],
    }));
  };

  private handleInputChange = (
    index: number,
    file: File | null,
    kind: AllowedDensityMapKinds
  ) => {
    const inputs = [...this.state.inputs];
    const { selectedFileNames } = this.state;

    if (file && file !== inputs[index].selectedFile) {
      if (selectedFileNames.has(file.name)) {
        console.log(`File ${file.name} has already been selected.`);
        this.setState({
          showMessage: true,
          message: `File ${file.name} has already been selected.`,
        });
        setTimeout(() => {
          this.setState({ showMessage: false, message: "" });
        }, 3000);
        return;
      } else {
        selectedFileNames.add(file.name);
      }
    }

    inputs[index] = { selectedKind: kind, selectedFile: file };
    this.setState({ inputs, selectedFileNames });
  };

  private removeInput = (index: number) => {
    const inputs = [...this.state.inputs];
    const fileToRemove = inputs[index].selectedFile;
    const fileName = fileToRemove?.name;

    // Remove from parent's densityMaps array if file exists
    if (fileToRemove) {
      const parentIndex = this.props.files.findIndex(
        (df) => df.file === fileToRemove
      );
      if (parentIndex !== -1) {
        this.props.onRemoveFile(parentIndex);
      }
    }

    // Remove from local selectedFileNames tracking
    if (fileName) {
      const selectedFileNames = new Set(this.state.selectedFileNames);
      selectedFileNames.delete(fileName);
      this.setState({ selectedFileNames });
    }

    // Remove from local inputs array
    inputs.splice(index, 1);
    this.setState({ inputs });
  };

  render() {
    const opts = this.fileTypeOptions();
    const { inputs, openModal, showMessage, message } = this.state;

    return (
      <div className="flex">
        <div className="flex">
          <div className="text-20px my-auto w-[147px]">Density maps</div>
          <button
            className="items-center flex justify-center p-3 font-700 w-[137px] text-16px bg-primary-first rounded-standard text-white hover:text-primary-first transition-all hover:bg-secondary-second"
            onClick={() => this.setState({ openModal: true })}
          >
            Add Files
          </button>
          {openModal && (
            <div className="absolute top-0 left-0 z-50 w-full h-full bg-test">
              <div className="relative p-6 mt-[10%] bg-primary-first rounded-standard text-white w-[625px] h-[400px] overflow-y-scroll m-auto">
                <div>
                  {inputs.map((input, index) => (
                    <div key={index} className="mb-2">
                      <FileInput
                        id={`upload-density-map-${index}`}
                        onChange={(e) => {
                          const file = e?.[0] ?? null;
                          this.handleInputChange(
                            index,
                            file,
                            input.selectedKind
                          );
                        }}
                        disabled={this.props.disabled}
                      />
                      <div className="flex">
                        {opts.length > 0 && (
                          <label
                            htmlFor={`upload-density-map-${index}`}
                            className="flex justify-end h-full"
                          >
                            <div className="min-w-[8.6rem] mr-2">
                              <button
                                disabled={this.props.disabled}
                                className="inline-block p-3 font-700 min-w-[137px] max-w-[290px] overflow-hidden whitespace-nowrap text-ellipsis text-16px bg-secondary-second rounded-standard text-primary-first hover:text-primary-first transition-all hover:bg-secondary-second"
                                onClick={() => {
                                  document
                                    .getElementById(
                                      `upload-density-map-${index}`
                                    )
                                    ?.click();
                                }}
                              >
                                {input.selectedFile
                                  ? `${input.selectedFile?.name}`
                                  : "Browse"}
                              </button>
                            </div>
                          </label>
                        )}
                        <div className="w-[8.6rem]">
                          <ComboBox
                            value={input.selectedKind}
                            options={opts}
                            onChange={(v) => {
                              this.handleInputChange(
                                index,
                                input.selectedFile,
                                v as AllowedDensityMapKinds
                              );
                            }}
                            sizing="auto"
                            theme="light"
                            disabled={this.props.disabled}
                          />
                        </div>
                        <button
                          className="ml-2 items-center flex justify-center p-2 font-700 w-[100px] text-16px bg-red-500 rounded-standard text-white hover:bg-red-600 transition-all"
                          onClick={() => this.removeInput(index)}
                          disabled={this.props.disabled}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {showMessage && (
                  <p className="text-secondary-third mb-2">{message}</p>
                )}
                <div className="flex">
                  <button
                    className="items-center flex justify-center p-3 font-700 text-16px bg-white rounded-standard text-primary-first hover:text-primary-first transition-all hover:bg-secondary-second mr-2"
                    onClick={this.addInput}
                  >
                    + Add file
                  </button>

                  <button
                    className="items-center flex justify-center px-4 py-1 font-700 text-16px bg-white rounded-standard text-primary-first hover:text-primary-first transition-all hover:bg-secondary-second"
                    onClick={() => {
                      this.setState({ openModal: false });
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

namespace DensityMapFiles {
  export interface Props {
    disabled: boolean;
    files: DensityMapFile[];
    onAddFile: (file: DensityMapFile) => void;
    onRemoveFile: (idx: number) => void;
  }
}
class FileInput extends React.Component<{
  id: string;
  onChange: (f: FileList | null) => void;
  disabled: boolean;
}> {
  static defaultProps = {
    disabled: false,
  };

  render() {
    return (
      <input
        id={this.props.id}
        className="rdo-input-file"
        type="file"
        onChange={(e) => this.props.onChange(e.currentTarget.files)}
        disabled={this.props.disabled}
      />
    );
  }
}

class LongFileName extends React.Component<{
  name: string;
  disabled: boolean;
}> {
  render() {
    return (
      <Tooltip
        display="block"
        overflow="hidden"
        tag={
          <span
            className={`${
              this.props.disabled ? "rdo-text-disabled" : ""
            } ml-2 overflow-hidden whitespace-nowrap`}
          >
            {this.props.name}
          </span>
        }
      >
        {this.props.name}
      </Tooltip>
    );
  }
}

class PdbIdInput extends React.Component<{
  pdbId: string;
  onChange: (v: string) => void;
  onExecute: () => void;
}> {
  render() {
    return (
      <input
        className="bg-primary-first placeholder:text-white text-white rounded-standard p-4 w-full items-center flex"
        style={{
          ...(!isPdbId(this.props.pdbId, true) && this.props.pdbId.length > 0
            ? { color: "#FF7973" }
            : {}),
        }}
        type="text"
        value={this.props.pdbId}
        onChange={(v) => {
          const text = v.currentTarget.value;
          if (text.length <= 12) this.props.onChange(v.currentTarget.value);
        }}
        onKeyDown={(ev) => {
          const key = ev.key;

          if (key === "Enter") {
            ev.currentTarget.blur();
            this.props.onExecute();
          }
        }}
        inputMode="text"
        placeholder="Enter PDB ID"
      />
    );
  }
}

interface State {
  coordsFile: File | null;
  densityMaps: DensityMapFile[];
  database: string;
  pdbId: string;
}
export class StartTab extends React.Component<StartTab.Props, State> {
  private densityMapFilesRef = React.createRef<DensityMapFiles>();

  private readonly DatabaseOptions = (() => {
    const opts = UserRemoteDatabases.list().map((x) => ({
      caption: x.name,
      value: x.id,
    }));

    for (const id in BuiltInRemoteDatabases) {
      opts.push({
        caption:
          BuiltInRemoteDatabases[id as keyof typeof BuiltInRemoteDatabases]
            .name,
        value: id,
      });
    }

    opts.push({ caption: "Custom file", value: "" });

    return opts;
  })();

  constructor(props: StartTab.Props) {
    super(props);

    this.state = {
      ...this.defaultState(),
    };
  }

  private actionCustomStructure() {
    console.log("actionCustomStructure called");
    try {
      if (!this.state.coordsFile) {
        console.log("No coordinates file set");
        Popup.create(
          <div className="text-secondary-third">
            You have not set any coordinates file
          </div>
        );
        return;
      }

      console.log("Coordinates file:", this.state.coordsFile.name);
      console.log("All density maps:", this.state.densityMaps.map(m => ({ name: m.file.name, kind: m.kind })));

      const densityMaps = this.state.densityMaps.filter(
        (x) => x.kind !== "coefficients"
      ) as { file: File; kind: DensityMap["kind"] }[];
      const densityMapCoeffs =
        this.state.densityMaps.find((x) => x.kind === "coefficients")?.file ??
        null;

      console.log("Filtered density maps (non-coefficients):", densityMaps.map(m => ({ name: m.file.name, kind: m.kind })));
      console.log("Density map coefficients:", densityMapCoeffs?.name ?? "null");

      console.log("Calling onDoCustomStructure");
      this.props.onDoCustomStructure(
        this.state.coordsFile!,
        densityMaps,
        densityMapCoeffs
      );
      console.log("onDoCustomStructure completed");
    } catch (e) {
      console.error("Error processing custom structure:", e);
      Popup.create(
        <div className="text-secondary-third">
          Error processing files: {e instanceof Error ? e.message : String(e)}
        </div>
      );
    }
  }

  private actionPdbId(db: string, pdbId: string) {
    if (!db) {
      Popup.create(
        <div className="text-secondary-third">No database is selected</div>
      );
    }

    try {
      const _pdbId = toPdbId(pdbId);
      this.props.onDoPdbId(_pdbId, db);
    } catch (e) {
      if (pdbId.length === 0) {
        Popup.create(
          <div className="text-secondary-third">
            Please enter a valid PDB ID
          </div>
        );
      } else {
        Popup.create(
          <div className="text-secondary-third">{`${pdbId} is not a valid PDB ID`}</div>
        );
      }
    }
  }

  private defaultState(): State {
    return {
      coordsFile: null,
      database:
        this.DatabaseOptions.find(
          (x) => x.value === GlobalConfig.data().primaryDatabase
        )?.value ?? this.DatabaseOptions[0].value,
      densityMaps: [],
      pdbId: "",
    };
  }

  private handleAnalyzeClick = () => {
    try {
      if (this.state.database) {
        this.actionPdbId(this.state.database, this.state.pdbId);
      } else {
        this.densityMapFilesRef.current?.handleAddFile();
        this.actionCustomStructure();
      }
    } catch (e) {
      console.error("Error in analyze click handler:", e);
      Popup.create(
        <div className="text-secondary-third">
          Error: {e instanceof Error ? e.message : String(e)}
        </div>
      );
    }
  };

  render() {
    return (
      <>
        <div className="flex flex-col h-full overflow-y-hidden">
          <div className="hidden select-none xl:block xl:absolute xl:top-[-1rem] xl:left-0 xl:w-[20%] xl:-z-1">
            <img src={DnaLeft} alt="DNA" />
          </div>
          <div className="hidden select-none xl:block xl:absolute xl:top-14 xl:right-0 xl:w-[24%] xl:-z-1">
            <img src={DnaRight} alt="DNA" />
          </div>
          <div>
            <div className="hidden floating select-none xl:block xl:absolute xl:top-0 xl:right-0 xl:z-50 xl:w-[11%] xl:mt-[24%] xl:mr-[19%]">
              <img src={Density} alt="Density" />
            </div>
            <div className="hidden floating select-none xl:block xl:absolute xl:top-0 xl:left-0 xl:z-50 xl:w-[11%] xl:mt-[20%] xl:ml-[19%]">
              <img src={NavalAform} alt="Naval aform" />
            </div>
            <div className="hidden floating select-none xl:block xl:absolute xl:top-0 xl:left-0 xl:z-50 xl:w-[9%] xl:mt-[32%] xl:ml-[23%]">
              <img src={Contacts} alt="Contacts" />
            </div>
          </div>
          <div className="overflow-hidden h-full flex flex-col">
            <div className="rdo-offset">
              <div className="mt-[5%]">
                <div className="text-34px w-[720px] m-auto text-center leading-10 font-roboto-bold">
                  <span className="text-secondary-first uppercase text-34px stroke">
                    Dnatco
                  </span>{" "}
                  enables an in-depth analysis and validation of nucleic acid
                  structures
                </div>
                <div className="mt-10 max-w-[850px] m-auto">
                  <div className="flex flex-col justify-center">
                    <div>
                      <Coordinates
                        coordsFile={this.state.coordsFile}
                        database={this.state.database}
                        databaseOptions={this.DatabaseOptions}
                        pdbId={this.state.pdbId}
                        onCoordsFileChange={(f) =>
                          this.setState({ ...this.state, coordsFile: f })
                        }
                        onDatabaseChange={(db) =>
                          this.setState({ ...this.state, database: db })
                        }
                        onPdbIdChange={(id) =>
                          this.setState({ ...this.state, pdbId: id })
                        }
                        onRun={() =>
                          this.actionPdbId(
                            this.state.database,
                            this.state.pdbId
                          )
                        }
                        onRunExample={(db, pdbId) =>
                          this.actionPdbId(db, pdbId)
                        }
                      />
                    </div>
                    {this.state.database === "" ? (
                      <div className="mx-auto w-[430px]">
                        <DensityMapFiles
                          disabled={this.state.database !== ""}
                          ref={this.densityMapFilesRef}
                          files={this.state.densityMaps}
                          onAddFile={(file) => {
                            this.state.densityMaps.push(file);
                            this.setState({ ...this.state });
                          }}
                          onRemoveFile={(idx) => {
                            this.state.densityMaps.splice(idx, 1);
                            this.setState({ ...this.state });
                          }}
                        />
                      </div>
                    ) : undefined}
                  </div>
                  <div className="w-[430px] mx-auto">
                    <div className="flex mt-2">
                      <AnalyzeButton
                        ready={this.props.dnatcofierState === "ready"}
                        onClick={this.handleAnalyzeClick}
                      />
                    </div>
                  </div>
                </div>
                {this.props.dnatcofierState === "initializing" ? (
                  <div className="flex flex-row items-center">
                    <div className="text-16px m-auto">
                      Please wait for {GlobalConfig.data().displayedProductName}{" "}
                      to initialize...
                    </div>
                  </div>
                ) : this.props.dnatcofierState === "failed" ? (
                  <div className="text-16px m-auto flex text-secondary-third">
                    {GlobalConfig.data().displayedProductName} failed to
                    initialize
                  </div>
                ) : undefined}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export namespace StartTab {
  export interface Props {
    onDoPdbId: (pdbId: string, db: string) => void;
    onDoCustomStructure: (
      coordsFile: File,
      densityMaps: { file: File; kind: DensityMap["kind"] }[],
      densityMapCoeffs: File | null
    ) => void;
    onDoRawLink: (link: string) => void;
    dnatcofierState: "ready" | "initializing" | "failed";
  }
}
