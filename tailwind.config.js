/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "black": "rgba(0, 0, 0, 0.75)",
        "white": "rgba(255, 255, 255, 0.8)", // white with opacity 80%
        "full-white": "#ffffff", // white

        "primary-first": "#30595C", // dark blue
        "primary-first-disabled": "rgba(49, 89, 92, 0.7)",  // dark blue with 70% opacity

        "secondary-first": "#E89E33", // yellow
        "secondary-first-hover": "rgba(232, 158, 51, 0.7)", // yellow with opacity 70%
        "secondary-second": "#B9DFEA", // light blue
        "secondary-second-hover": "rgba(185, 223, 234, 0.5)", // blue with 50% opacity
        "secondary-third": "#DD4B32", // red

        "test": "rgba(255, 248, 234, 0.7)",
        "gray": "#808080",
        "a": "#feeba1", 
        "b": "#c8cfff",
        "BII": "#1459d9",
        "miB": "#3ee9fc",
        "Z": "#41f60d",
        "IC": "#f95cfb",
        "OPN": "#e90200",
        "SYN": "#fa8223",
        "N": "#f2f2f2",
      },

      fontFamily: {
        'roboto-regular': ['roboto-regular'],
        'roboto-bold': ['roboto-bold']
      },

      fontWeight: {
        '300': 300, 
        '400': 400, 
        '700': 700,
      },

      borderRadius: {
        'standart': '15px',
        'smaller': '10px',
      },
      
      fontSize: {
        '10px': '0.625rem',
        '11px': '0.6875rem',
        '12px': '0.75rem',
        '13px': '0.8125rem',
        '14px': '0.875rem',
        '15px': '0.9375rem',
        '16px': '1.0rem',
        '17px': '1.0625rem',
        '18px': '1.125rem',
        '19px': '1.1875rem',
        '20px': '1.25rem',
        '21px': '1.3125rem',
        '22px': '1.375rem',
        '23px': '1.4375rem',
        '24px': '1.5rem',
        '25px': '1.5625rem',
        '26px': '1.625rem',
        '27px': '1.6875rem',
        '28px': '1.75rem',
        '29px': '1.8125rem',
        '30px': '1.875rem',
        '31px': '1.9375rem',
        '32px': '2.0rem',
        '33px': '2.0625rem',
        '34px': '2.125rem',
        '35px': '2.1875rem',
        '36px': '2.25rem',
        '37px': '2.3125rem',
        '38px': '2.375rem',
        '39px': '2.4375rem',
        '40px': '2.5rem',
        '41px': '2.5625rem',
        '42px': '2.625rem',
        '43px': '2.6875rem',
        '44px': '2.75rem',
        '45px': '2.8125rem',
        '46px': '2.875rem',
        '47px': '2.9375rem',
        '48px': '3.0rem',
        '49px': '3.0625rem',
        '50px': '3.125rem',
        '51px': '3.1875rem',
        '52px': '3.25rem',
        '53px': '3.3125rem',
        '54px': '3.375rem',
        '55px': '3.4375rem',
        '56px': '3.5rem',
        '57px': '3.5625rem',
        '58px': '3.625rem',
        '59px': '3.6875rem',
        '60px': '3.75rem',
        '61px': '3.8125rem',
        '62px': '3.875rem',
        '63px': '3.9375rem',
        '64px': '4.0rem',
        '65px': '4.0625rem',
        '66px': '4.125rem',
        '67px': '4.1875rem',
        '68px': '4.25rem',
        '69px': '4.3125rem',
        '70px': '4.375rem',
        '71px': '4.4375rem',
        '72px': '4.5rem',
        '73px': '4.5625rem',
        '74px': '4.625rem',
        '75px': '4.6875rem',
        '76px': '4.75rem',
        '77px': '4.8125rem',
        '78px': '4.875rem',
        '79px': '4.9375rem',
        '80px': '5.0rem',
        '81px': '5.0625rem',
        '82px': '5.125rem',
        '83px': '5.1875rem',
        '84px': '5.25rem',
        '85px': '5.3125rem',
        '86px': '5.375rem',
        '87px': '5.4375rem',
        '88px': '5.5rem',
        '89px': '5.5625rem',
        '90px': '5.625rem',
        '91px': '5.6875rem',
        '92px': '5.75rem',
        '93px': '5.8125rem',
        '94px': '5.875rem',
        '95px': '5.9375rem',
        '96px': '6.0rem',
        '97px': '6.0625rem',
        '98px': '6.125rem',
        '99px': '6.1875rem',
        '100px': '6.25rem',
        'feature': '5.2vw',
      },

      margin: {
        '13': '13%',
        'minus3': '-3rem',
        'minus2.5': '-2.5rem',
        'minus1': '-1rem',
        '0.25r': '0.25rem',
        '0.5r': '0.5rem',
        '0.75r': '0.75rem',
        '1r': '1rem',
        '1.25r': '1.25rem',
        '1.5r': '1.5rem',
        '2r': '2rem',
        '2.25r': '2.25rem',
        '2.5r': '2.5rem',
        '3r': '3rem',
        '3.25r': '3.25rem',
        '3.5r': '3.5rem',
        '4r': '4rem',
        '4.5r': '4.5rem',
        '5r': '5rem',
        '6r': '6rem',
      },

      padding: {
        '0.375r': '0.375rem',
        '0.5r': '0.5rem',
        '1r': '1rem',
        '1.25r': '1.25rem',
        '1.5r': '1.5rem',
        '1.75r': '1.75rem',
        '2r': '2rem',
        '2.5r': '2.5rem',
        '3r': '3rem',
        '3.5r': '3.5rem',
        '4r': '4rem',
        '5r': '5rem',
        '7r': '7rem',
        '8r': '8rem',
        '8.5r': '8.5rem',
        '10r': '10rem',
        '12r': '12rem',
        '15r': '15rem',
      },

      width: {
        '300px': '300px',
        '400px': '400px',
        '1024px': '1024px',
      },

      lineHeight: {
        '1.1': '1.1',
        '1.2': '1.2',
        '1.4': '1.4',
        '1.6': '1.6'
      },

      spacing: {
        '400px': '400px',
      },

      minHeight: {
        '4vw': '4vw',
      },

      borderWidth: {
        DEFAULT: '1px',
      },

      height: {
        '244px': '244px',
        '308px': '308px',
        '324px': '324px',
      }
    },
  },
  corePlugins: {
  },
  plugins: [
  ],
}
