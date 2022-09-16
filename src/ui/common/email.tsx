import * as React from 'react';

export class Email extends React.Component<{ email: string, children: React.ReactNode }> {
    render() {
        return <a href={`mailto:${this.props.email}`} className='rdo-email'>{this.props.children}</a>;
    }
}
