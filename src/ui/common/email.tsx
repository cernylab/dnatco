import * as React from 'react';

export class Email extends React.Component<{
    email: string,
    children: React.ReactNode,
    subject?: string,
}> {
    private makeAddr() {
        let addr = `mailto:${this.props.email}`;
        if (this.props.subject)
            addr += `?subject=${encodeURI(this.props.subject)}`;

        return addr;
    }

    render() {
        return <a href={this.makeAddr()} className='rdo-email'>{this.props.children}</a>;
    }
}
