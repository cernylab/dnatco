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
type PlotKind = 'euclid' | 'rmsd' | 'rmsd_euclid';

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
            for (const kind of [ 'euclid', 'rmsd', 'rmsd_euclid' ] as PlotKind[]) {
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
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 30% 30% 30%',
                rowGap: '0.5em',
                width: '100%',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>Conformer</span>
                    <ComboBox
                        options={toComboBoxOptions(NtCClassesWithNANT, cls => ({ caption: cls, value: cls}))}
                        value={this.state.ntc}
                        onChange={v => this.setState({ ...this.state, ntc: v })}
                        disabled={PlotCompomentCache.size === 0}
                    />
                </div>
                <div className='rdo-section-caption' style={{ fontWeight: 'bold' }} >RSCC vs. Euclidean distance</div>
                <div className='rdo-section-caption' style={{ fontWeight: 'bold' }}>RSCC vs. Cartesian rmsd</div>
                <div className='rdo-section-caption' style={{ fontWeight: 'bold' }}>Cartesian vs. Euclidean</div>

                <div className='rdo-vertical-text rdo-section-caption' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{'At least 1.8\u212B resolution'}</div>
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'le18', 'euclid'))?.() ?? Placeholder}
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'le18', 'rmsd'))?.() ?? Placeholder}
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'le18', 'rmsd_euclid'))?.() ?? Placeholder}

                <div className='rdo-vertical-text rdo-section-caption' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{'Worse than 2.5\u212B resolution'}</div>
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'gt25', 'euclid'))?.() ?? Placeholder}
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'gt25', 'rmsd'))?.() ?? Placeholder}
                {PlotCompomentCache.get(plotTag(this.state.ntc, 'gt25', 'rmsd_euclid'))?.() ?? Placeholder}
            </div>
        );
    }
}
