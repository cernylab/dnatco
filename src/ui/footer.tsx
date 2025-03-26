import * as React from 'react';
import { Email } from './common/email';
import { ElixirLogoImg, IbtLogoImg } from '../assets/images';
import { Globals } from '../globals'; 
import { useNavigate } from 'react-router';

const Footer:React.FC = () => {
    
    const navigate = useNavigate();

    const handleAboutClick = (selectedTab: string) => {
        // Pass the selectedTab prop when navigating
        navigate('/app/about', { state: { selectedTab } });
      };

    return (
        <>
            <div className='bg-primary-first text-white'>
                <div className='items-center lg:flex lg:justify-between mx-auto my-4 xl:max-w-[1280px] 2xl:max-w-[1440px]'>
                    <div className='flex justify-center'>
                        <div className='my-auto mx-1'>
                            <div className='text-18px text-center'>© 2024</div>
                        </div>
                        {Globals.PrimaryContacts.map((c, idx) => (
                            <div className='my-auto mx-1' key={idx}>
                                <div className='text-18px text-center'>
                                    <Email email={c.email} subject='DNATCO'><span>{c.name}</span></Email>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='flex justify-center'>
                        <div
                            onClick={() => handleAboutClick('how-to-cite')}
                            className='hover-animation my-auto mx-3'
                        >
                            <a className='cursor-pointer text-18px'>
                                How to cite
                            </a>
                        </div>
                        <div
                            onClick={() => handleAboutClick('help')}
                            className='hover-animation my-auto mx-3'
                        >
                            <a className='cursor-pointer text-18px'>
                                Help
                            </a>
                        </div>
                        <div
                            onClick={() => handleAboutClick('contact')} 
                            className='hover-animation my-auto mx-3'>
                            <a className='cursor-pointer text-18px'>
                                Contact
                            </a>
                        </div>
                    </div>

                    <div className='flex justify-center'>
                        <div className='my-auto mx-2'>
                            <div className='text-18px text-center'>
                                <div>Supported by Institute of Biotechnology & Elixir CZ</div>
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
