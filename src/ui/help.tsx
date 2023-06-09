import React from 'react';

export namespace Help {
    export function Container(props: { children: React.ReactNode }) {
        const [isMouseIn, setIsMouseIn] = React.useState(false);

        return (
            <div
                className={isMouseIn ? 'rdo-scroll-vertically-with-scrollbar' : 'rdo-scroll-vertically'}
                onMouseOver={() => setIsMouseIn(true)}
                onMouseLeave={() => setIsMouseIn(false)}
            >
                {props.children}
            </div>
        );
    }
}
