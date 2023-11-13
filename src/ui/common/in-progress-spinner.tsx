import React from 'react';
import { ThingsAreHappeningImg } from '../../assets/images';

export class InProgressSpinner extends React.Component<{}> {

    render() {
        return (
            <img
                src={ThingsAreHappeningImg}
                className='animate-spin'
                style={{
                    height: '1.5em',
                    width: 'auto',
                }}
            />
        );
    }
}
