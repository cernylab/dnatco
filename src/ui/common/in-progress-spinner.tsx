import React from 'react';
import { ThingsAreHappeningImg } from '../../assets/images';

export class InProgressSpinner extends React.Component<{}, { angle: number }> {
    spinInterval: number = 0;

    constructor(props: {}) {
        super(props);

        this.state = { angle: 0 };
    }

    componentDidMount(): void {
        this.spinInterval = window.setInterval(() => {
            const angle = (this.state.angle + 90) % 360;
            this.setState({ ...this.state, angle });
        }, 150);
    }

    componentWillUnmount() {
        if (this.spinInterval !== 0)
            window.clearInterval(this.spinInterval);
    }

    render() {
        return (
            <img
                src={ThingsAreHappeningImg}
                style={{
                    height: '1.5em',
                    width: 'auto',
                    transform: `rotate(${this.state.angle}deg)`,
                }}
            />
        );
    }
}
