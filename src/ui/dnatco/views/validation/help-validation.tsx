import * as React from 'react';
import { View } from '../view';
import { validation } from '../../../../help-tags';

export class HelpValidation extends View {
        render() {

            const displayValidation = validation.map(page => ({
                headline: page.headline,
                subHeadlineText: page.subHeadlineText,
                sections: page.sections.map(section => ({
                    headline: section.headline,
                    paragraphs: section.paragraphs
                }))
            }))

            return (
                <div>
                    {displayValidation.map((page:any, index:any) => (
                        <>
                            <div key={index} className='flex border-t-secondary-second border-t pt-3 mb-8'>
                                <div className='w-[25%]'>
                                    <h3 className='font-700 text-18px mb-2 uppercase'>
                                        {page.headline}
                                    </h3>
                                </div>
                                <div className='w-[75%] text-16px mb-2 text-justify'>
                                    {page.subHeadlineText}
                                </div>
                            </div>
                            {page.sections.map((section:any, idx:any) => (
                                <div key={index + '-' + idx} className='flex border-t-secondary-second border-t pt-3 mb-8'>
                                    <div className='w-[25%]'>
                                        <h3 className='font-700 text-18px mb-2 uppercase'>
                                            {section.headline}
                                        </h3>
                                    </div>
                                    <div className='w-[75%] text-16px mb-2 text-justify'>
                                        {section.paragraphs.map((item: any, itemIdx: any) => (
                                            <div key={itemIdx}>
                                                {item.type === 'paragraph' && (
                                                    <>
                                                        <p>{item.text}</p>
                                                        <div className='h-3'></div>
                                                    </>
                                                )}
                                                {item.type === 'image' && (
                                                    <img src={item.url} alt={`Image ${itemIdx}`} className={`${item.width} my-4`} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    ))}
                </div>
            );
        }
    }

export namespace HelpValidation {
    export const StepSwitcher = () => {}
}