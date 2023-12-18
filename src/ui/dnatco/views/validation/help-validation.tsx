import * as React from 'react';
import { View } from '../view';
import { validation } from '../../../../help-tags';

export class HelpValidation extends View {
        render() {
            return (
                <div>
                    <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h2 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {validation[0].headline}
                            </h2>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {validation[0].subHeadlineText}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {validation[0].sections.confalsRMSD.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {validation[0].sections.confalsRMSD.paragraph1}
                            <div className='h-3'></div>
                            {validation[0].sections.confalsRMSD.paragraph2}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {validation[0].sections.stepTorsions.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {validation[0].sections.stepTorsions.paragraph1}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {validation[0].sections.similarityPlot.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {validation[0].sections.similarityPlot.paragraph1}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {validation[0].sections.rsccRmsdPlot.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {validation[0].sections.rsccRmsdPlot.paragraph1}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {validation[0].sections.bondLengthsAngles.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {validation[0].sections.bondLengthsAngles.paragraph1}
                        </div>
                    </div>
                </div>
            );
        }
    }

export namespace HelpValidation {
    export const StepSwitcher = () => {}
}