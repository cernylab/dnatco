import type { StandardLonghandProperties } from 'csstype';
import * as jsLLKA from 'jsllka';
import React from 'react';
import { BasePushButton } from '../common/push-button';
import { GlobalConfig } from '../../global-config';
import { ClassificationContext } from '../../dnatco/classification-context';
import { Step } from '../../dnatco/step';
import '../../../../assets/imgs/data-transfer-download.svg';

export namespace Common {
    export const NA = 'N/A';

    export const MethodsWithCommonResolution = ['x-ray diffraction', 'neutron diffraction', 'fiber diffraction', 'electron crystallography', 'powder diffraction'];

    export const BarHeightEm = 0.75;
    export const VScrollElement = { overflow: 'hidden', flex: 1 } as StandardLonghandProperties;
    export const VScrollJail = { overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' } as StandardLonghandProperties;
    export const VScrollGridJail = { overflow: 'hidden', height: '100%', display: 'grid' } as StandardLonghandProperties;
    export const StyleScoreBar = { width: '100%', height: `${BarHeightEm}em` };
    export const StyleTableSameColumnWidth = { tableLayout: 'fixed', width: '100%' } as StandardLonghandProperties;
}

export function confalPercentile(confalScore: number) {
    return jsLLKA.LLKA.confalPercentile(confalScore, ClassificationContext.context());
}

export function niceStepName(step: Step, showModelNum = false) {
    return (
        <span>
            {showModelNum
                ? <>
                    <span className='rdo-nice-step-model'>M{step.model}</span><div className='rdo-nice-step-msep'>{'\u00A0'}</div>
                </>
                : undefined
            }
            <span className='rdo-nice-step-base'>{step.base1}</span>
            <span className='rdo-nice-step-brsep'>{'\u00A0'}</span>
            <span className='rdo-nice-step-residue'>{step.resNo1Auth}{step.insCode1}</span>
            {step.altPos1 !== '' ? <span className='rdo-nice-step-altpos'>(alt. {step.altPos1})</span> : void 0}

            <div className='rdo-nice-step-fssep'>{'\u00A0'}</div>

            <span className='rdo-nice-step-base'>{step.base2}</span>
            <span className='rdo-nice-step-brsep'>{'\u00A0'}</span>
            <span className='rdo-nice-step-residue'>{step.resNo2Auth}{step.insCode2}</span>
            {step.altPos2 !== '' ? <span className='rdo-nice-step-altpos'>(alt. {step.altPos2})</span> : void 0}
        </span>
    );
}

export function niceStepNameText(step: Step, showModelNum = false) {
    const SP = '\u00A0';

    const nice =
        step.base1 + SP +
        step.resNo1Auth + step.insCode1 +
        (step.altPos1 !== '' ? `(alt ${step.altPos1})` : '') +
        SP +
        step.base2 + SP +
        step.resNo2Auth + step.insCode2 +
        (step.altPos2 !== '' ? `(alt ${step.altPos2})` : '');

    return (showModelNum ? `M${step.model} ` : '') + nice;
}

export function DownloadButton(props: { caption?: string, onClick: () => void }) {
    return (
        <BasePushButton
            {...props}
            className='rdo-icon-text-button'
            classNameDisabled='rdo-icon-text-button-disabled'
        >
            <div
                className='rdo-pushbutton-inner-container'
                style={{ paddingLeft: '0.5em', paddingRight: '0.5em' }}
            >
                <img
                    style={{ height: '50%' }}
                    src={`${GlobalConfig.data().pathPrefix}/imgs/data-transfer-download.svg`}
                />
                {props.caption
                    ? <span className='rdo-pushbutton-text' style={{ flex: 1, whiteSpace: 'nowrap' }}>{props.caption}</span>
                    : void 0
                }
            </div>
        </BasePushButton>
    );
}
