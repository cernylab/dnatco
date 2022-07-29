import * as React from 'react';
import { NamedList } from './common/named-list';
import { ShadowedBox } from './common/shadowed-box';
import { Tooltip } from './common/tooltip';
import { WasmSupport } from 'jsLLKA';

export class AboutTab extends React.Component {
    render() {
        return (
            <div className='rdo-offset'>
                <ShadowedBox>
                    <div className='rdo-primary-caption'>
                         About ReDNATCO
                    </div>
                    <div>
                        TODO
                    </div>

                    <div className='rdo-section-caption'>
                        Supported browser features
                        <div className='rdo-offset'>
                            <NamedList
                                style='centered'
                                items={[
                                    {
                                        name: 'WebAssembly',
                                        value: (
                                            <span>
                                                {WasmSupport.wasm ? 'Yes' : <span className='rdo-error-text'>No</span>}
                                                &nbsp;
                                                <Tooltip
                                                    tag='[?]'
                                                >
                                                    <div style={{ maxWidth: '25em' }}>
                                                        WebAssembly support allows the browser to use a compiled variant of the DNATCO library which offers better performance.
                                                        In the absence of WebAssembly support, plain JavaScript version of the library will be used instead.
                                                    </div>
                                                </Tooltip>
                                            </span>
                                        )
                                    },
                                    {
                                        name: 'WebAssembly SIMD',
                                        value: (
                                            <span>
                                                {WasmSupport.simd ? 'Yes' : <span className='rdo-error-text'>No</span>}
                                                &nbsp;
                                                <Tooltip
                                                    tag='[?]'
                                                >
                                                    <div style={{ maxWidth: '25em' }}>
                                                        WebAssembly SIMD support allows the browser to use a variant of the DNATCO library that makes use of SIMD (Single Instruction, Multiple Data) instructions. SIMD instructions
                                                        can speed up some mathematical operations that manipulate with large sets of numbers.
                                                    </div>
                                                </Tooltip>
                                            </span>
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </div>
                </ShadowedBox>
            </div>
        );
    }
}
