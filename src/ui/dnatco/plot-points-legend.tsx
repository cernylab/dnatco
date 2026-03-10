import React from "react";
import {
  DotFilledIcon,
  SquareIcon,
  Cross1Icon
} from "@radix-ui/react-icons"

const DefaultProps = {
  normal: true,
  current: true,
  computed: false,
};

export function PlotPointsLegend(
  props: Partial<{
    normal: boolean;
    current: boolean;
    computed: boolean;
  }>
) {
  const show = { ...DefaultProps, ...props };
  return (
    <div className="flex flex-row justify-center gap-4 items-center">
      {show.normal ? (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <DotFilledIcon className={"text-primary-first font-bold scale-[2]"} /> - NtC
        </div>
      ) : (
        void 0
      )}
      {show.current ? (
        <div className="flex flex-row justify-center gap-1 items-center">
          <Cross1Icon className={"text-primary-first [stroke-width:1.5px] [stroke:currentColor]"} /> - Currently shown NtC
        </div>
      ) : (
        void 0
      )}
      {show.computed ? (
        <div className="flex flex-row justify-center gap-1 items-center">
          <SquareIcon className={"text-primary-first font-bold bg-primary-first"} /> - Computed NtC
        </div>
      ) : (
        void 0
      )}
    </div>
  );
}
