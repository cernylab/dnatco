import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { DataTransferDownloadImg } from '../../assets/images';
import { BasePushButton } from '../common/push-button';
import { Step } from '../../dnatco/step';

export namespace Common {
    export const BarHeightEm = 0.75;
    export const VScrollElement = { overflow: 'hidden', flex: 1 } as StandardLonghandProperties;
    export const VScrollJail = { overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' } as StandardLonghandProperties;
    export const VScrollGridJail = { overflow: 'hidden', height: '100%', display: 'grid' } as StandardLonghandProperties;
    export const StyleScoreBar = { width: '100%', height: `${BarHeightEm}em` };
    export const StyleTableSameColumnWidth = { tableLayout: 'fixed', width: '100%' } as StandardLonghandProperties;
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
                    src={DataTransferDownloadImg}
                />
                {props.caption
                    ? <span className='rdo-pushbutton-text' style={{ flex: 1, whiteSpace: 'nowrap' }}>{props.caption}</span>
                    : void 0
                }
            </div>
        </BasePushButton>
    );
}
