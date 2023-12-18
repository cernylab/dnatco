import * as React from 'react';
import { View } from '../view';
import { refinement } from '../../../../help-tags';

export class HelpRefinement extends View {
        render() {
            return (
                <div>
                    <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h2 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {refinement[0].headline}
                            </h2>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {refinement[0].subHeadlineText}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {refinement[0].sections.connectivityPlot.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {refinement[0].sections.connectivityPlot.paragraph1}
                            <div className='h-3'></div>
                            {refinement[0].sections.connectivityPlot.paragraph2}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {refinement[0].sections.restraints.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {refinement[0].sections.restraints.paragraph1}
                            <div className='h-3'></div>
                            {refinement[0].sections.restraints.paragraph2}
                            <div className='h-3'></div>
                            {refinement[0].sections.restraints.paragraph3}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {refinement[0].sections.changeNtCs.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {refinement[0].sections.changeNtCs.paragraph1}
                        </div>
                    </div>
                </div>
            );
        }
    }

export namespace HelpRefinement {
    export const StepSwitcher = () => {}
}