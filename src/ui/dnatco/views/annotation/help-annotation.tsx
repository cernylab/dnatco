import * as React from 'react';
import { View } from '../view';
import { annotation } from '../../../../help-tags';

export class HelpAnnotation extends View {
        render() {
            return (
                <div>
                    <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h2 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {annotation[0].headline}
                            </h2>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {annotation[0].subHeadlineText}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {annotation[0].sections.assignedNtCs.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {annotation[0].sections.assignedNtCs.paragraph1}
                            <div className='h-3'></div>
                            {annotation[0].sections.assignedNtCs.paragraph2}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {annotation[0].sections.structureInfo.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {annotation[0].sections.structureInfo.paragraph1}
                        </div>
                    </div>
                    <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                                {annotation[0].sections.downloads.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            {annotation[0].sections.downloads.paragraph1}
                        </div>
                    </div>
                </div>
            );
        }
    }

export namespace HelpAnnotation {
    export const StepSwitcher = () => {}
}