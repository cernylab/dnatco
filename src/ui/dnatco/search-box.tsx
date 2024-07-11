import React from "react";
import * as RDC from "react-dom/client";
import { IconButton, PushButton } from "../common/push-button";
import { ChevronRightImg } from "../../assets/images";

function positionStyle(
  anchor: SearchBox.Props<any>["anchor"],
  x: number,
  y: number
): React.CSSProperties {
  if (anchor === "top-left") {
    return {
      position: "absolute",
      left: x + "px",
      top: y + "px",
    };
  } else {
    return {
      position: "absolute",
      right: x + "px",
      bottom: y + "px",
    };
  }
}

function reducer<T>(
  state: State<T>,
  action: ClearAction | SetAction<T>
): State<T> {
  switch (action.kind) {
    case "clear":
      return { ...state, results: [], searchPrompt: "" };
    case "set":
      return {
        ...state,
        results: action.results,
        searchPrompt: action.searchPrompt,
      };
  }
}

/* Yes, this is a functional component because class components are a pain to use with generics */
type ClearAction = {
  kind: "clear";
};
type SetAction<T> = {
  kind: "set";
  results: T[];
  searchPrompt: string;
};
type State<T> = {
  results: T[];
  searchPrompt: string;
};

const ClearAction: ClearAction = { kind: "clear" };

export function SearchBox<T>(props: SearchBox.Props<T>) {
  const [state, dispatch] = React.useReducer(reducer, {
    results: [],
    searchPrompt: "",
  });

  return (
    <div
      className="rdo-search-box"
      style={positionStyle(props.anchor, props.xOffset, props.yOffset)}
    >
      <div className="font-700">{props.caption}</div>
      <input
        autoFocus={true}
        className="text-22px"
        type="text"
        value={state.searchPrompt}
        onKeyDown={(ev) => {
          if (ev.code === "Enter" && state.results.length > 0) {
            ev.preventDefault();
            ev.stopPropagation();
            props.searching.onUseResult((state as State<T>).results[0]);
          } else if (ev.code === "Escape") {
            ev.preventDefault();
            ev.stopPropagation();
            props.onClose();
          }
        }}
        onChange={(ev) => {
          const v = ev.currentTarget.value;
          if (!v) {
            dispatch(ClearAction);
            return;
          }

          const results = props.searching.onSearch(v);
          dispatch({ kind: "set", results, searchPrompt: v });
        }}
      />
      <div className="flex flex-col gap-2">
        {(state as State<T>).results.map((x, idx) => (
          <div className="flex flex-row gap-4" key={idx}>
            <div className="flex-1">
              {props.searching.onRenderResult(x, props.searching.onUseResult)}
            </div>
            <IconButton
              className="rdo-pushbutton"
              src={ChevronRightImg}
              onClick={() => props.searching.onUseResult(x)}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-row">
        <div className="flex-1" />
        <PushButton onClick={props.onClose} caption="Close" />
      </div>
    </div>
  );
}

export namespace SearchBox {
  export interface Searching<T> {
    onRenderResult: (
      result: T,
      onUseResult: (result: T) => void
    ) => JSX.Element;
    onSearch: (prompt: string) => T[];
    onUseResult: (result: T) => void;
  }

  export interface Props<T> {
    anchor: "top-left" | "bottom-right";
    xOffset: number;
    yOffset: number;
    caption: string;
    onClose: () => void;
    searching: Searching<T>;
  }

  export function create<T>(parent: HTMLElement, props: Props<T>) {
    const tainer = document.createElement("div");
    const closeHandler = props.onClose;

    const reactRoot = RDC.createRoot(tainer!);
    reactRoot.render(
      <SearchBox
        {...props}
        onClose={() => {
          parent.removeChild(tainer);
          closeHandler();
        }}
      />
    );

    parent.appendChild(tainer);
  }
}
