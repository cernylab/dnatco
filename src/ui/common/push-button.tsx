import * as React from 'react';
import { GlobalConfig } from '../../global-config';

export class BasePushButton<P extends BasePushButton.Props> extends React.Component<P> {
    static defaultProps = {
        enabled: true,
    };

    protected clsName() {
        if (this.props.enabled)
            return this.props.className ?? '';
        else
            return this.props.classNameDisabled ?? '';
    }

    render() {
        return (
            <div
                className={this.clsName()}
                onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                    if (this.props.enabled && this.props.onClick)
                        this.props.onClick(e);
                }}
                onMouseDown={e => {
                    if (this.props.enabled && this.props.onMouseDown)
                        this.props.onMouseDown(e);
                }}
                onMouseUp={e => {
                    if (this.props.enabled && this.props.onMouseUp)
                        this.props.onMouseUp(e);
                }}
                onMouseEnter={e => {
                    if (this.props.enabled && this.props.onMouseEnter)
                        this.props.onMouseEnter(e);
                }}
                onMouseLeave={e => {
                    if (this.props.enabled && this.props.onMouseLeave)
                        this.props.onMouseLeave(e);
                }}
            >
                {this.props.children}
            </div>
        );
    }
}

export class DummyButton extends React.Component<{ caption: string, enabled: boolean, className?: string, classNameDisabled?: string }> {
    static defaultProps = {
        enabled: true,
    };

    protected clsName() {
        if (this.props.enabled)
            return this.props.className ?? 'rdo-pushbutton rdo-pushbutton-border';
        else
            return this.props.classNameDisabled ?? 'rdo-pushbutton-disabled rdo-pushbutton-border';
    }

    render() {
        return (
            <div className={this.clsName()}>
                <div className='rdo-pushbutton-text'>{this.props.caption}</div>
            </div>
        );
    }
}

export class IconButton extends React.Component<IconButton.Props> {
    static defaultProps = {
        enabled: true,
    };

    render() {
        return (
            <BasePushButton
                {...this.props}
                className={this.props.className ?? 'rdo-icon-button'}
                classNameDisabled={this.props.classNameDisabled ?? 'rdo-icon-button-disabled'}
            >
                <div style={{ display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}>
                    <img
                        style={{ margin: '0.25em' }}
                        src={`${GlobalConfig.data().pathPrefix}${this.props.src}`}
                    />
                </div>
            </BasePushButton>
        );
    }
}

export class PushButton extends BasePushButton<PushButton.Props> {
    static defaultProps = {
        enabled: true,
    };

    protected clsName() {
        if (this.props.enabled)
            return this.props.className ?? 'rdo-pushbutton rdo-pushbutton-border';
        else
            return this.props.classNameDisabled ?? 'rdo-pushbutton-disabled rdo-pushbutton-border';
    }

    render() {
        return (
            <div
                className={this.clsName()}
                onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                    if (this.props.enabled && this.props.onClick)
                        this.props.onClick(e);
                }}
                onMouseDown={e => {
                    if (this.props.enabled && this.props.onMouseDown)
                        this.props.onMouseDown(e);
                }}
                onMouseUp={e => {
                    if (this.props.enabled && this.props.onMouseUp)
                        this.props.onMouseUp(e);
                }}
                onMouseEnter={e => {
                    if (this.props.enabled && this.props.onMouseEnter)
                        this.props.onMouseEnter(e);
                }}
                onMouseLeave={e => {
                    if (this.props.enabled && this.props.onMouseLeave)
                        this.props.onMouseLeave(e);
                }}
            >
                <div className='rdo-pushbutton-text'>{this.props.caption}</div>
            </div>
        );
    }
}

export namespace BasePushButton {
    export interface Props {
        enabled: boolean;
        onClick?: (e: React.MouseEvent) => void;
        onMouseDown?: (e: React.MouseEvent) => void;
        onMouseUp?: (e: React.MouseEvent) => void;
        onMouseEnter?: (e: React.MouseEvent) => void;
        onMouseLeave?: (e: React.MouseEvent) => void;
        className?: string
        classNameDisabled?: string;
        children?: React.ReactNode;
    }
}

export namespace IconButton {
    export interface Props extends BasePushButton.Props {
        src: string;
    }
}

export namespace PushButton {
    export interface Props extends BasePushButton.Props {
        caption: string;
    }
}