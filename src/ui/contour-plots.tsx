import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { Subject } from 'rxjs';
import { toComboBoxOptions } from './util';
import { WithSubscriptions } from './service/with-subscriptions';
import { ComboBox } from './common/combo-box';
import { NtC } from '../dnatco/ntc';
import { GlobalConfig } from '../global-config';

let PlotCompomentCache = new Map<string, () => JSX.Element>();
const PlotCompomentCachePopulated = new Subject<void>();
const EmptyTainerStyle = { margin: 'auto', fontSize: 'var(--font-large)', width: '100%', textAlign: 'center' as StandardLonghandProperties['textAlign'] };
const Placeholder = <div style={EmptyTainerStyle}>Loading data...</div>;
const NtCClassesWithNANT = [...NtC.Classes, 'NANT'];

type PlotResolution = 'le18' | 'gt25';
type PlotKind = 'euclid' | 'rmsd';

function plotTag(ntc: string, res: PlotResolution, kind: PlotKind) {
    return `${ntc}_${res}_${kind}`;
}

async function populateCache() {
    if (PlotCompomentCache.size > 0)
        return;

    const pathPrefix = GlobalConfig.data().pathPrefix;
    const cache = new Map<string, () => JSX.Element>();

    const pending = new Array<[Promise<Response>, string, string]>();

    for (const ntc of NtCClassesWithNANT) {
        for (const res of [ 'le18', 'gt25' ] as PlotResolution[]) {
            for (const kind of [ 'euclid', 'rmsd' ] as PlotKind[]) {
                const urlPrefix = `${pathPrefix}/contour_plots/${res}/${ntc}_${kind}`;

                // We check if there is a file with the plot available on the server.
                // We do not want to cache this file or anything because we'd just waste memory
                // and the browser may cache the file for us anyway.
                // We need to do this to decide whether to display the plot or "no data" component.

                // Spin up the fetches
                pending.push([fetch(urlPrefix + '.png'), plotTag(ntc, res, kind), urlPrefix]);
            }
        }
    }

    for (const [p, tag, urlPrefix] of pending) {
        const data = await p;
        if (data.ok) {
            const array = new Uint8Array(await data.arrayBuffer());

            cache.set(
                tag,
                () => {
                    const base64 = 'data:image/png;base64,' + window.btoa(array.reduce((data, ch) => data + String.fromCharCode(ch), ''));
                    return (
                        <a href={urlPrefix + '.pdf'}>
                            <img className='rdo-autosized' src={base64} />
                        </a>
                    );
                }
            );
        } else {
            cache.set(
                tag,
                () => <div style={EmptyTainerStyle}>No data</div>
            );
        }
    }

    PlotCompomentCache = cache;
    PlotCompomentCachePopulated.next();
}

interface State {
    ntc: string;
}
export class ContourPlots extends WithSubscriptions<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            ntc: 'AA00'
        };
    }

    componentDidMount() {
        this.subscribe(
            PlotCompomentCachePopulated, () => this.forceUpdate()
        );
        populateCache();
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div className='' style={{
                display: 'grid',
                gridTemplateColumns: 'auto 45% 45%',
                rowGap: '0.5em',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className='flex flex-col items-center'>
                    <div className='font-din-2014 text-22px uppercase font-700 mb-4'>NtC conformer</div>
                    <ComboBox
                        options={toComboBoxOptions(NtCClassesWithNANT, cls => ({ caption: cls, value: cls}))}
                        value={this.state.ntc}
                        onChange={v => this.setState({ ...this.state, ntc: v })}
                        disabled={PlotCompomentCache.size === 0}
                        sizing='maximum-available'
                        innerStyle={{ fontSize: 'var(--font-large)' }}
                    />
                </div>
                <div className='text-20px mb-2 text-center font-700'>RSCC vs. Torsion space</div>
                <div className='text-20px mb-2 text-center font-700'>RSCC vs. Cartesian rmsd</div>

                <div className='rdo-vertical-text text-20px mb-2 text-center flex items-center justify-center font-700'>{'At least 1.8\u00C5 resolution'}</div>
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'le18', 'euclid'))?.() ?? Placeholder}
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'le18', 'rmsd'))?.() ?? Placeholder}

                <div className='rdo-vertical-text text-20px mb-2 text-center font-700 flex items-center justify-center'>{'Worse than 2.5\u00C5 resolution'}</div>
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'gt25', 'euclid'))?.() ?? Placeholder}
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'gt25', 'rmsd'))?.() ?? Placeholder}
            </div>
        );
    }
}
