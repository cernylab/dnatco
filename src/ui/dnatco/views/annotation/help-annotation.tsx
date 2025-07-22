import * as React from 'react';
import { View } from '../view';
import { annotation } from '../../../../help-tags';

export class HelpAnnotation extends View {
        render() {

            const displayAnnotation = annotation.map(page => ({
                headline: page.headline,
                paragraphs: page.paragraphs.map(paragraph => paragraph)
            }))

            return (
                <div>
                    {displayAnnotation.map((page: any, index:any) => (
                        <div key={index} className='flex border-t-secondary-second border-t pt-3 mb-8'>
                            <div className='w-[25%]'>
                                <h3 className='font-700 text-18px mb-2 uppercase'>
                                    {page.headline}
                                </h3>
                            </div>
                            <div className='w-[75%] text-16px mb-2 text-justify'>
                                <div className='h-3'></div>
                                {page.paragraphs.map((paragraph: any, idx: any) => (
                                    <div key={idx}>
                                        {paragraph}
                                        <div className='h-3'></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
    }

export namespace HelpAnnotation {
    export const StepSwitcher = () => {}
}