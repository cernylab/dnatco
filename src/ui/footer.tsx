import * as React from 'react';
import { useEffect, useState } from 'react';
import { Email } from './common/email';
import { ElixirLogoImg, IbtLogoImg } from '../assets/images';
import { Globals } from '../globals';
import { Link, useLocation } from 'react-router';

const Footer:React.FC = () => {
    const location = useLocation();

    // Check if we're in a DNATCO analysis view where we want to preserve Mol* state
    const isInAnalysisView = location.pathname.match(/^\/app\/dnatco\/(annotation|validation|refinement|downloads)/);

    const [compact, setCompact] = useState(window.innerWidth <1024);
    useEffect(() => {
        const handleResize = () => setCompact(window.innerWidth < 1024);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <div className='bg-primary-first text-white fixed bottom-0 left-0 w-full'>
                <div className='flex flex-nowrap items-center justify-center space-x-3 lg:flex lg:justify-between mx-auto my-1 xl:max-w-[1280px] 2xl:max-w-[1440px]'>
                    <div className='flex justify-center'>
                        <div className='my-auto mx-1'>
                            <div className='text-16px text-center'>© 2025</div>
                        </div>
                        {Globals.PrimaryContacts.map((c, idx) => (
                            <div className='my-auto mx-1' key={idx}>
                                <div className='text-16px text-center'>
                                    <Email email={c.email} subject='DNATCO'><span>{c.name}</span></Email>
                                </div>
                            </div>
                        ))}
                    </div>

                    {compact && (
                        <div className='flex justify-center'>
                            <span className='px-3'>|</span>
                            <div className='hover-animation my-auto mx-3'>
                                {isInAnalysisView ? (
                                    <a className='cursor-pointer text-16px' href='/app/about/help' target='_blank' rel='noopener noreferrer'>
                                        Help
                                    </a>
                                ) : (
                                    <Link className='cursor-pointer text-16px' to='/app/about/help'>
                                        Help
                                    </Link>
                                )}
                            </div>
                            <span className='px-3'>|</span>
                        </div>
                    )}

                    {!compact && (
                        <div className='flex justify-center'>
                            <div className='hover-animation my-auto mx-3'>
                                {isInAnalysisView ? (
                                    <a className='cursor-pointer text-16px' href='/app/about/how-to-cite' target='_blank' rel='noopener noreferrer'>
                                        How to cite
                                    </a>
                                ) : (
                                    <Link className='cursor-pointer text-16px' to='/app/about/how-to-cite'>
                                        How to cite
                                    </Link>
                                )}
                            </div>
                            <div className='hover-animation my-auto mx-3'>
                                {isInAnalysisView ? (
                                    <a className='cursor-pointer text-16px' href='/app/about/help' target='_blank' rel='noopener noreferrer'>
                                        Help
                                    </a>
                                ) : (
                                    <Link className='cursor-pointer text-16px' to='/app/about/help'>
                                        Help
                                    </Link>
                                )}
                            </div>
                            <div className='hover-animation my-auto mx-3'>
                                {isInAnalysisView ? (
                                    <a className='cursor-pointer text-16px' href='/app/about/contact' target='_blank' rel='noopener noreferrer'>
                                        Contact
                                    </a>
                                ) : (
                                    <Link className='cursor-pointer text-16px' to='/app/about/contact'>
                                        Contact
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    <div className='flex justify-center'>
                        {!compact && (
                            <div className='my-auto mx-2'>
                                <div className='text-18px text-center'>
                                    <div>Supported by</div>
                                </div>
                            </div>
                        )}
                        <div className='flex my-auto mx-2'>
                            <a className='bg-white p-1 rounded-standard mr-2' href='https://www.ibt.cas.cz/en' target='_blank'>
                                <img className='h-8 hover-animation' src={IbtLogoImg} alt='Ibt logo'/>
                            </a>
                            <a className='bg-white p-1 rounded-standard' href='https://www.elixir-czech.cz/' target='_blank'>
                                <img className='h-8 hover-animation' src={ElixirLogoImg} alt='Elixir logo'/>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Footer;
