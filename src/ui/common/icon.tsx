import React from 'react';

export class Icon extends React.Component<{ img: string, size: 'text'|'1.5x-text'|string }> {
    private cssSize() {
        switch (this.props.size) {
        case 'text':
            return '1em';
        case '1.5x-text':
            return '1.5em';
        default:
            return this.props.size;
        }
    }
    render() {
        const size = this.cssSize();

        return (
            <div className='rdo-icon-tainer' style={{ width: size, height: size }}>
                <img
                    className='rdo-icon'
                    src={this.props.img}
                />
            </div>
        );
    }
}
