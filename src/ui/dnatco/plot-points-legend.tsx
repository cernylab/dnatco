import React from "react";

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
        <div>
          <span className="font-bold text-18px">{"\u23FA"}</span> - NtC
        </div>
      ) : (
        void 0
      )}
      {show.current ? (
        <div>
          <span className="font-bold text-18px">{"\u2715"}</span> - Currently
          shown NtC
        </div>
      ) : (
        void 0
      )}
      {show.computed ? (
        <div>
          <span className="font-bold text-18px">{"\u23F9"}</span> - Computed NtC
        </div>
      ) : (
        void 0
      )}
    </div>
  );
}
