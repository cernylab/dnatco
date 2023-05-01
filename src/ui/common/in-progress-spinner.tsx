import React from 'react';
import { GlobalConfig } from '../../global-config';
// Image assets
import 'assets/imgs/things-are-happening.svg';


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
        const Prefix = GlobalConfig.data().pathPrefix;

        return (
            <img
                src={`${Prefix}/imgs/things-are-happening.svg`}
                style={{
                    height: '1.5em',
                    width: 'auto',
                    transform: `rotate(${this.state.angle}deg)`,
                }}
            />
        );
    }
}
