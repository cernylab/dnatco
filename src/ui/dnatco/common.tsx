import type { StandardLonghandProperties } from "csstype";
import React from "react";
import { arrowDown } from "../../assets/images";
import { BasePushButton } from "../common/push-button";
import { Step } from "../../dnatco/step";

export namespace Common {
  export const BarHeightEm = 0.75;
  export const VScrollJail = {
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  } as StandardLonghandProperties;
}

export function niceStepName(step: Step, showModelNum = false) {
  return (
    <span>
      {showModelNum ? (
        <>
          <span className="rdo-nice-step-model">M{step.model}</span>
          <div className="inline-block w-1">{"\u00A0"}</div>
        </>
      ) : undefined}
      <span className="rdo-nice-step-base">{step.base1}</span>
      <span className="rdo-nice-step-brsep">{"\u00A0"}</span>
      <span className="rdo-nice-step-residue">
        {step.resNo1Auth}
        {step.insCode1}
      </span>
      {step.altPos1 !== "" ? (
        <span className="rdo-nice-step-altpos">(alt. {step.altPos1})</span>
      ) : (
        void 0
      )}

      <div className="inline-block w-3">{"\u00A0"}</div>

      <span className="rdo-nice-step-base">{step.base2}</span>
      <span className="rdo-nice-step-brsep">{"\u00A0"}</span>
      <span className="rdo-nice-step-residue">
        {step.resNo2Auth}
        {step.insCode2}
      </span>
      {step.altPos2 !== "" ? (
        <span className="rdo-nice-step-altpos">(alt. {step.altPos2})</span>
      ) : (
        void 0
      )}
    </span>
  );
}

export function DownloadButton(props: {
  caption?: string;
  onClick: () => void;
}) {
  return (
    <BasePushButton
      {...props}
      className="rdo-icon-text-button"
      classNameDisabled="rdo-icon-text-button-disabled"
    >
      <div className="items-center flex h-full justify-center px-4 py-2 bg-primary-first text-white rounded-standard m-2">
        <img className="w-4" src={arrowDown} />
        {props.caption ? (
          <div className="font-700 m-1">{props.caption}</div>
        ) : (
          void 0
        )}
      </div>
    </BasePushButton>
  );
}

interface ButtonComponentProps {
  title: string;
  defaultImage: string;
  hoverImage: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const DownloadButtonComponent: React.FC<ButtonComponentProps> = ({
  title,
  defaultImage,
  hoverImage,
  onClick,
}) => {
  const [imageSrc, setImageSrc] = React.useState(defaultImage);

  const handleMouseOver = () => {
    setImageSrc(hoverImage);
  };

  const handleMouseOut = () => {
    setImageSrc(defaultImage);
  };

  return (
    <button
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      className="flex bg-primary-first ml-2 px-4 py-2 rounded-smaller items-center h-fit text-white hover:bg-secondary-second hover:text-primary-first transition-all"
      onClick={onClick}
    >
      <div className="image-container">
        <img className="w-4 h-4 mr-2" src={imageSrc} alt="Image" />
      </div>
      {title}
    </button>
  );
};
