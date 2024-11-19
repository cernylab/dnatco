import React from "react";
import * as RDC from "react-dom/client";
import { TriangleDownImg, XImg } from "../../assets/images";

class WindowStack {
  private readonly BottomZIndex = 100;
  private stack: { zIndex: number; elem: HTMLDivElement }[] = [];

  private restack() {
    for (let idx = this.stack.length - 1; idx >= 0; idx--) {
      const elem = this.stack[idx].elem;
      const actualZIndex = parseInt(elem.style.zIndex);
      const targetZIndex = this.BottomZIndex + idx;
      if (actualZIndex !== targetZIndex) elem.style.zIndex = `${targetZIndex}`;
    }
  }

  focus(w: HTMLDivElement) {
    const idx = this.stack.findIndex((item) => item.elem === w);
    if (idx !== -1) {
      const item = this.stack.splice(idx, 1)[0];
      this.stack.push(item);

      this.restack();
    }
  }

  push(w: HTMLDivElement) {
    const previous =
      this.stack.length > 0 ? this.stack[this.stack.length - 1] : void 0;

    const zIndex = previous ? previous.zIndex + 1 : this.BottomZIndex;
    this.stack.push({ zIndex, elem: w });
    w.style.zIndex = `${zIndex}`;
  }

  remove(w: HTMLElement) {
    const idx = this.stack.findIndex((item) => item.elem === w);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
      this.restack();
    }
  }
}
const windowStack = new WindowStack();

function Header(props: {
  title: string | JSX.Element;
  onClosed: () => void;
  onCollapsedExpanded: (expanded: boolean) => void;
  onDragged: (dx: number, dy: number) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hdrRef = React.createRef<HTMLDivElement>();
  const title =
    typeof props.title === "string" ? (
      <div className="font-700">{props.title}</div>
    ) : (
      props.title
    );

  React.useEffect(() => {
    const onDown = (evt: MouseEvent) => {
      evt.preventDefault();

      const onMove = (ev: MouseEvent) => {
        ev.preventDefault();

        const dx =
          ev.clientX < 0 || ev.clientX >= window.innerWidth ? 0 : ev.movementX;
        const dy =
          ev.clientY < 0 || ev.clientY >= window.innerHeight ? 0 : ev.movementY;
        props.onDragged(dx, dy);
      };
      const onUp = () => {
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("mousemove", onMove);
      };
      window.addEventListener("mouseup", onUp);
      window.addEventListener("mousemove", onMove);
    };

    hdrRef.current!.addEventListener("mousedown", onDown);

    return () => {
      hdrRef.current?.removeEventListener("mousedown", onDown);
    };
  }, []);

  return (
    <div
      className={`${
        isExpanded ? "w-full" : "w-max"
      } items-center border-b-[0.1px] border-primary-first flex flex-row justify-between`}
    >
      <div ref={hdrRef} className="cursor-move">
        {title}
      </div>
      <div className="flex">
        <div
          onClick={() => {
            const ce = !isExpanded;
            setIsExpanded(ce);
            props.onCollapsedExpanded(ce);
          }}
        >
          <img
            className="w-4 h-4"
            src={TriangleDownImg}
            style={{
              transition: "rotate var(--anim-speed)",
              rotate: isExpanded ? "180deg" : "0deg",
            }}
          />
        </div>
        <div onClick={() => props.onClosed()}>
          <img className="w-4 h-4" src={XImg} />
        </div>
      </div>
    </div>
  );
}

function TheWindow(props: {
  title: string | JSX.Element;
  content: JSX.Element;
  onClosed: () => void;
  initialPosition?: { x: number; y: number };
  resizeOptions?: Window.ResizeOptions;
}) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [position, setPosition] = React.useState(
    props.initialPosition ?? { x: 0, y: 0 }
  );
  const [size, setSize] = React.useState({
    width: props.resizeOptions?.initialWidth
      ? props.resizeOptions.initialWidth
      : -1,
    height: props.resizeOptions?.initialHeight
      ? props.resizeOptions.initialHeight
      : -1,
  });
  const tRef = React.useRef<HTMLDivElement>(null);

  const resW = !!props.resizeOptions?.resizeableWidth;
  const resH = !!props.resizeOptions?.resizeableHeight;
  // These would be better calculated dynamically from the Header geometry.
  const MinimumHeight = 32;
  const MininumWidth = 64;

  React.useLayoutEffect(() => {
    const self = tRef.current!;

    const bRect = self.getBoundingClientRect();
    const overflowX = bRect.right - document.body.clientWidth;
    const overflowY = bRect.bottom - document.body.clientHeight;

    setPosition((pos) => ({
      x: overflowX > 0 ? pos.x - overflowX : pos.x,
      y: overflowY > 0 ? pos.y - overflowY : pos.y,
    }));
  }, []);

  const reposition = (dx: number, dy: number) => {
    setPosition((pos) => {
      let newX = pos.x + dx;
      newX =
        newX < 0
          ? 0
          : newX > window.innerWidth - (tRef.current?.clientWidth ?? 0)
          ? window.innerWidth - (tRef.current?.clientWidth ?? 0)
          : newX;
      let newY = pos.y + dy;
      newY =
        newY < 0
          ? 0
          : newY > window.innerHeight - (tRef.current?.clientHeight ?? 0)
          ? window.innerHeight - (tRef.current?.clientHeight ?? 0)
          : newY;
      return { x: newX, y: newY };
    });
  };

  return (
    <div
      className="rdo-window absolute p-[0.2em] flex flex-col bg-white border-[0.1px] backdrop-blur border-primary-first rounded-[5px]"
      ref={tRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: size.width > 0 ? `${size.width}px` : void 0,
        height: size.height > 0 ? `${size.height}px` : void 0,
        overflow: "clip",
      }}
    >
      <Header
        title={props.title}
        onClosed={() => props.onClosed()}
        onCollapsedExpanded={(expanded) => setIsExpanded(expanded)}
        onDragged={(dx, dy) => reposition(dx, dy)}
      />
      <div
        style={{
          flexBasis: isExpanded ? "100%" : "0%",
          display: isExpanded ? "block" : "none",
        }}
      >
        {props.content}
      </div>
      {isExpanded && (resW || resH) ? (
        <div
          style={{
            position: "absolute",
            width: "1em",
            height: "1em",
            right: "-0.5em",
            bottom: "-0.5em",
            transform: "rotate(45deg)",
            cursor: resW
              ? resH
                ? "nwse-resize"
                : "ew-resize"
              : resH
              ? "ns-resize"
              : "not-allowed",
            backgroundColor: "var(--color-a)",
          }}
          onMouseDown={(evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            const onMove = (ev: MouseEvent) => {
              ev.preventDefault();
              ev.stopPropagation();

              const dx =
                resW && ev.clientX >= 0 && ev.clientX < window.innerWidth
                  ? ev.movementX
                  : 0;
              const dy =
                resH && ev.clientY >= 0 && ev.clientY < window.innerHeight
                  ? ev.movementY
                  : 0;

              setSize((sz) => {
                const newWidth =
                  (sz.width < 0 && resW
                    ? tRef.current!.clientWidth
                    : sz.width) + dx;
                const newHeight =
                  (sz.height < 0 && resH
                    ? tRef.current!.clientHeight
                    : sz.height) + dy;

                return {
                  width:
                    newWidth > MininumWidth || !resW ? newWidth : MininumWidth,
                  height:
                    newHeight > MinimumHeight || !resH
                      ? newHeight
                      : MinimumHeight,
                };
              });
              if (props.resizeOptions?.forceResize)
                window.dispatchEvent(new Event("resize"));
            };
            const onUp = () => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        />
      ) : null}
    </div>
  );
}

export namespace Window {
  export type Handle = {
    close: () => void;
  };
  export type ResizeOptions = {
    resizeableWidth?: boolean;
    initialWidth?: number;
    resizeableHeight?: boolean;
    initialHeight?: number;
    forceResize?: boolean;
  };

  export function create(
    content: JSX.Element,
    title: string | JSX.Element,
    initialPosition?: { x: number; y: number },
    onClosed?: (hwnd: Window.Handle) => void,
    resizeOptions?: ResizeOptions
  ): Window.Handle {
    const tainer = document.createElement("div");
    tainer.classList.add("rdo-window-tainer");
    document.body.appendChild(tainer);

    const mouseDown = () => {
      windowStack.focus(tainer);
    };

    const dismisser = () => {
      tainer.removeEventListener("mousedown", mouseDown);
      windowStack.remove(tainer);
      document.body.removeChild(tainer);
    };
    tainer.addEventListener("mousedown", mouseDown);
    windowStack.push(tainer);

    const hwnd = {
      close: dismisser,
    };

    const root = RDC.createRoot(tainer);
    root.render(
      <TheWindow
        content={content}
        title={title}
        initialPosition={initialPosition}
        resizeOptions={resizeOptions}
        onClosed={() => {
          dismisser();
          onClosed?.(hwnd);
        }}
      />
    );

    return hwnd;
  }
}
