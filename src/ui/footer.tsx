import * as React from 'react';
import { Email } from './common/email';
import { ElixirLogoImg, IbtLogoImg } from '../assets/images';
import { Globals } from '../globals';


export function Footer() {
    return (
        <>
            <div className='bg-primary-first text-white'>
                <div className='max-w-[1280px] flex justify-between mx-auto my-4'>
                    <div className='flex'>
                        <div className='my-auto mx-1'>
                            <div className='text-18px text-center font-din-2014'>© 2022</div>
                        </div>
                        {Globals.PrimaryContacts.map((c, idx) => (
                            <div className='my-auto mx-1' key={idx}>
                                <div className='text-18px text-center font-din-2014'>
                                    <Email email={c.email} subject='DNATCO'><span style={{ color: 'var(--color-c)' }}>{c.name}</span></Email>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='flex'>
                        <div className='hover-animation my-auto mx-3'><a className='cursor-pointer text-18px font-din-2014' href='/#/app/about'>About</a></div>
                        <div className='hover-animation my-auto mx-3'><a className='cursor-pointer text-18px'>Contact</a></div>
                    </div>

                    <div className='flex'>
                        <div className='my-auto mx-2'>
                            <div className='text-18px text-center font-din-2014'>
                                <div>Supported by Institute of Biotechnology & Elixir CZ</div>
                            </div>
                        </div>
                        <div className='flex my-auto mx-2'>
                            <a href='https://www.ibt.cas.cz/en' target='_blank'>
                                <img className='h-12' src={IbtLogoImg} alt='Ibt logo'/>
                            </a>
                            <a href='https://www.elixir-czech.cz/' target='_blank'>
                                <img className='h-12' src={ElixirLogoImg} alt='Elixir logo'/>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
