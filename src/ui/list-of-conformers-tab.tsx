import * as React from 'react';
import { ShadowedBox } from './common/shadowed-box';
import { ListOfConformers } from '../dnatco/list-of-conformers';

function fmtInt(n: number) {
    if (isNaN(n))
        return '-';
    let ns = n.toFixed(0);
    const L = ns.length;
    let rs = ns[L - 1];
    for (let idx = 1; idx < L; idx++) {
        if (idx % 3 === 0)
            rs = ' ' + rs;
        rs = ns[L - idx - 1] + rs;
    }

    return rs;
}

function fmtFlt(f: number, n = 1) {
    if (isNaN(f))
        return '-';
    return f.toFixed(n);
}

export class ListOfConformersTab extends React.Component {
    private renderList() {
        if (!ListOfConformers.has()) {
            if (ListOfConformers.failed())
                return <div className='rdo-error-text'>{`List of conformers failed to load: ${ListOfConformers.fail}`}</div>
            return <div>List of conformers is still loading...</div>
        }

        let totalDNACount = 0;
        let totalRNACount = 0;
        let totalGSCount = 0;

        return (
            <table className='rdo-list-of-conformers'>
                <thead>
                    <tr>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-bb'>Annotation</th>
                        <th className='rdo-list-of-conformers-bb'>CANA</th>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-bb'>NtC</th>
                        <th className='rdo-list-of-conformers-bb'>N DNA</th>
                        <th className='rdo-list-of-conformers-bb'>% DNA</th>
                        <th className='rdo-list-of-conformers-bb'>N RNA</th>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-bb'>% RNA</th>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-bb'>N GS</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-highlighted-col'>δ1</th>
                        <th className='rdo-list-of-conformers-bb'>ε1</th>
                        <th className='rdo-list-of-conformers-bb'>ζ1</th>
                        <th className='rdo-list-of-conformers-bb'>α2</th>
                        <th className='rdo-list-of-conformers-bb'>β2</th>
                        <th className='rdo-list-of-conformers-bb'>γ2</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-highlighted-col'>δ2</th>
                        <th className='rdo-list-of-conformers-bb'>χ1</th>
                        <th className='rdo-list-of-conformers-bb'>χ2</th>
                        <th className='rdo-list-of-conformers-bb'>μ</th>
                        <th className='rdo-list-of-conformers-bb'>NN</th>
                        <th className='rdo-list-of-conformers-bb'>C'C'</th>
                    </tr>
                </thead>
                <tbody>
                {
                    ListOfConformers.list.map((info, idx) => {
                        totalDNACount += info.countInDNA;
                        totalRNACount += info.countInRNA;
                        totalGSCount += info.countGS;

                        return (
                            <tr
                                className={
                                    info.highlight
                                        ?
                                        'rdo-list-of-conformers-highlighted-row'
                                        :
                                        idx % 2 === 1
                                            ? 'rdo-list-of-conformers-alternate-clr' : ''
                                }
                                key={idx}
                            >
                                <td className='rdo-list-of-conformers-rb'>{info.description}</td>
                                <td className='rdo-talgn-center'>{info.CANA}</td>
                                <td className='rdo-list-of-conformers-rb rdo-talgn-center'>{info.NtC}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.countInDNA)}</td>
                                <td className='rdo-talgn-right'>{fmtFlt(info.percentInDNA)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.countInRNA)}</td>
                                <td className='rdo-list-of-conformers-rb rdo-talgn-right'>{fmtFlt(info.percentInRNA)}</td>
                                <td className='rdo-list-of-conformers-rb rdo-talgn-right'>{fmtInt(info.countGS)}</td>
                                <td className={`rdo-talgn-right rdo-list-of-conformers-highlighted-${info.highlight ? 'row' : 'col'}`}>{fmtInt(info.delta1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.epsilon1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.zeta1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.alpha2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.beta2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.gamma2)}</td>
                                <td className={`rdo-talgn-right rdo-list-of-conformers-highlighted-${info.highlight ? 'row' : 'col'}`}>{fmtInt(info.delta2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.chi1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.chi2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.mu)}</td>
                                <td className='rdo-talgn-right'>{fmtFlt(info.NN)}</td>
                                <td className='rdo-talgn-right'>{fmtFlt(info.CC)}</td>
                            </tr>
                        );
                    })
                }
                    <tr>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb rdo-talgn-right'>{fmtInt(totalDNACount)}</td>
                        <td className='rdo-list-of-conformers-tb rdo-talgn-right'></td>
                        <td className='rdo-list-of-conformers-tb rdo-talgn-right'>{fmtInt(totalRNACount)}</td>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb rdo-talgn-right'></td>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb rdo-talgn-right'>{fmtInt(totalGSCount)}</td>
                        <td className='rdo-list-of-conformers-tb rdo-list-of-conformers-highlighted-col'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb rdo-list-of-conformers-highlighted-col'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th className='rdo-list-of-conformers-rb'>Annotation</th>
                        <th>CANA</th>
                        <th className='rdo-list-of-conformers-rb'>NtC</th>
                        <th className='rdo-list-of-conformers-tb'>N DNA</th>
                        <th className='rdo-list-of-conformers-tb'>% DNA</th>
                        <th className='rdo-list-of-conformers-tb'>N RNA</th>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb'>% RNA</th>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb'>N GS</th>
                        <th className='rdo-list-of-conformers-highlighted-col'>δ1</th>
                        <th>ε1</th>
                        <th>ζ1</th>
                        <th>α2</th>
                        <th>β2</th>
                        <th>γ2</th>
                        <th className='rdo-list-of-conformers-highlighted-col'>δ2</th>
                        <th>χ1</th>
                        <th>χ2</th>
                        <th>μ</th>
                        <th>NN</th>
                        <th>C'C'</th>
                    </tr>
                </thead>
            </table>
        );
    }

    render() {
        return (
            <div className='rdo-offset'>
                <ShadowedBox>
                    <div style={{ height: '100%', overflow: 'hidden' }}>
                        <div className='rdo-primary-caption'>List of conformers</div>
                        <div style={{ height: 'calc(100% - 72pt)', overflow: 'hidden' }}>
                            <div className='rdo-scroll-vertically'>
                                {this.renderList()}
                            </div>
                        </div>
                    </div>
                </ShadowedBox>
            </div>
        );
    }
}

