import * as React from 'react';
import { Email } from './common/email';
import { ElixirLogoImg, IbtLogoImg } from '../assets/images';
import { Globals } from '../globals'; 
import { Link } from 'react-router';

const Footer:React.FC = () => {

    return (
        <>
            <div className='bg-primary-first text-white'>
                <div className='items-center flex justify-between mx-6 my-2 xl:mx-auto xl:max-w-[1280px] 2xl:max-w-[1440px]'>
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

                    <div className='hidden lg:flex justify-center'>
                        <div className='hover-animation my-auto mx-3' >
                            <Link className='cursor-pointer text-16px' to='/app/about/how-to-cite'>
                                How to cite
                            </Link>
                        </div>
                        <div className='hover-animation my-auto mx-3' >
                            <Link className='cursor-pointer text-16px' to='/app/about/help'>
                                Help
                            </Link>
                        </div>
                        <div className='hover-animation my-auto mx-3' >
                            <Link className='cursor-pointer text-16px' to='/app/about/contact'>
                                Contact
                            </Link>
                        </div>
                    </div>

                    <div className='flex justify-center'>
                        <div className='my-auto mx-2'>
                            <div className='text-16px text-center'>
                                <div>Supported by</div>
                            </div>
                        </div>
                        <div className='flex my-auto mx-2'>
                            <a className='bg-white p-2 rounded-standard mr-2' href='https://www.ibt.cas.cz/en' target='_blank'>
                                <img className='h-8 hover-animation' src={IbtLogoImg} alt='Ibt logo'/>
                            </a>
                            <a className='bg-white p-2 rounded-standard' href='https://www.elixir-czech.cz/' target='_blank'>
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
