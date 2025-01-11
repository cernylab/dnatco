import { ThingsAreHappeningImg } from "../../assets/images";
import { v4 as uuidv4 } from "uuid";

const SpinnerStyle = "height: 1.5em; width: auto;";

export namespace InProgress {
  function makeAbortButton() {
    return `
            <div class="rdo-pushbutton">
                <div class="font-700 text-16px m-1">Abort</div>
            </div>
        `;
  }
  function makeContent(
    title: string,
    status: string,
    abortButton: boolean,
    spinnerId: string
  ) {
    return `
            <div class="absolute top-0 left-0 h-full w-full z-[999] m-auto bg-test">
                <div class="bg-primary-first flex flex-col mx-auto p-4 relative top-[45%] rounded-standart max-w-[33%] text-white">
                    <div class="flex justify-between">
                        <div id='rdo-current-operation'>
                            ${makeText(title, status)}
                        </div>
                        <img
                            class="animate-spin"
                            src="${ThingsAreHappeningImg}"
                            style="${SpinnerStyle}"
                            id="${spinnerId}"
                        />

                    </div>
                    <div class="rdo-popup-button-bar">
                        <div style="flex: 1">&nbsp;</div>
                        ${abortButton ? makeAbortButton() : ""}
                    </div>
                </div>
            </div>
        `;
  }

  function makeText(title: string, status: string) {
    return `
            <div style="font-weight: bold">${title}</div>
            <div style>${status.length === 0 ? "&nbsp;" : status}</div>
        `;
  }

  export function bindAbort(
    tainer: HTMLElement,
    handler: (ev: MouseEvent) => void
  ) {
    const btn = tainer.getElementsByClassName("rdo-pushbutton")[0];
    if (btn) (btn as HTMLDivElement).onclick = handler;

    tainer.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") handler(new MouseEvent("mousedown"));
    });
  }

  export async function create(
    title: string,
    status: string,
    abortButton: boolean
  ): Promise<HTMLElement> {
    const tainer = document.createElement("div");
    tainer.tabIndex = 0;

    /* We cannot use React because it renders stuff asynchronously
     * but we need to be sure that this dialog will be visible before
     * any further code is executed. Let's do it the old-fashioned way.
     */
    const spinnerId = uuidv4();
    tainer.innerHTML = makeContent(title, status, abortButton, spinnerId);

    /* We need to set up inteval to make the spinner spin. We also need to make sure
     * that we clear the interval when the popup gets destroyed.
     */
    const rot = { angle: 0 };
    const spinnerInterval = window.setInterval(() => {
      const elem = document.getElementById(spinnerId);
      if (elem) {
        elem.style.transform = `rotate(${rot.angle}deg)`;
        rot.angle = (rot.angle + 90) % 360;
      }
    }, 100);
    new MutationObserver((mList, obs) => {
      for (const mut of mList) {
        if (mut.type === "childList") {
          mut.removedNodes.forEach((node) => {
            if (node.isSameNode(tainer)) {
              window.clearInterval(spinnerInterval);
              obs.disconnect();
            }
          });
        }
      }
    }).observe(document.body, { childList: true });

    /* We also need to wait for the browser to actually render the element.
     * For that we need to observe some events.
     * We need to do this from a promise so that we can await for it to happen.
     * ResizeObserver seems to be the most reliable way how to get this to work
     */
    const prom = new Promise<HTMLElement>((resolve, _reject) => {
      const observer = new ResizeObserver((entries, obs) => {
        obs.disconnect();
        resolve(tainer);
      });
      observer.observe(tainer);
      document.body.appendChild(tainer);
    });

    return prom;
  }

  export function dismiss(tainer: HTMLElement) {
    document.body.removeChild(tainer);
  }

  export function update(tainer: HTMLElement, title: string, status: string) {
    tainer.querySelector('#rdo-current-operation')!.innerHTML = makeText(
      title,
      status
    );
  }
}
