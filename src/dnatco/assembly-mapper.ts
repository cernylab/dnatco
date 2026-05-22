import { Cif } from '../cif';
import { PdbxStructAssemblyGen } from '../cif/categories/pdbx-struct-assembly';
import { Dnatcofication } from './dnatcofication';
import { Logger } from '../log/logger';

export type AssemblyMapping = {
    // Maps label chain ID (asym_id) to assembly ID
    labelChainToAssembly: Map<string, string>,
    // Maps auth chain ID (auth_asym_id) to assembly ID
    authChainToAssembly: Map<string, string>,
    // Maps assembly ID to list of label chain IDs
    assemblyToLabelChains: Map<string, string[]>,
    // Maps assembly ID to list of auth chain IDs
    assemblyToAuthChains: Map<string, string[]>,
};

export namespace AssemblyMapper {
    /**
     * Parse assembly data from CIF and build mappings between chains and assemblies
     */
    export function buildMapping(cifData: Cif.Data, structure: Dnatcofication['data']['structures'][0]): AssemblyMapping | null {
        // Check if assembly data exists
        if (!Cif.File.hasTable(cifData, PdbxStructAssemblyGen)) {
            return null;
        }

        const assemblyGenTable = Cif.File.table(cifData, PdbxStructAssemblyGen);

        const labelChainToAssembly = new Map<string, string>();
        const authChainToAssembly = new Map<string, string>();
        const assemblyToLabelChains = new Map<string, string[]>();
        const assemblyToAuthChains = new Map<string, string[]>();

        // Build a mapping from label chain IDs to auth chain IDs from the structure
        const labelToAuthChain = new Map<string, string>();
        const authToLabelChain = new Map<string, string>();
        for (const model of structure.models) {
            for (const chain of model.chains) {
                labelToAuthChain.set(chain.name, chain.authName);
                authToLabelChain.set(chain.authName, chain.name);
            }
        }

        // Parse assembly data
        const rowCount = assemblyGenTable.assembly_id.values?.length ?? 0;
        for (let i = 0; i < rowCount; i++) {
            const assemblyId = Cif.Column.value(assemblyGenTable.assembly_id, i);
            const asymIdList = Cif.Column.value(assemblyGenTable.asym_id_list, i);

            if (!assemblyId || !asymIdList) continue;

            // Parse the asym_id_list (comma-separated list of label chain IDs)
            const labelChainIds = asymIdList.split(',').map(id => id.trim());

            // Initialize assembly arrays if needed
            if (!assemblyToLabelChains.has(assemblyId)) {
                assemblyToLabelChains.set(assemblyId, []);
                assemblyToAuthChains.set(assemblyId, []);
            }

            // Use a Set to collect unique auth chain IDs for this assembly
            const authChainIdsForAssembly = new Set<string>();

            // Map each label chain to this assembly
            for (const labelChainId of labelChainIds) {
                labelChainToAssembly.set(labelChainId, assemblyId);
                assemblyToLabelChains.get(assemblyId)!.push(labelChainId);

                // Also collect the corresponding auth chain ID
                const authChainId = labelToAuthChain.get(labelChainId);
                if (authChainId) {
                    authChainToAssembly.set(authChainId, assemblyId);
                    authChainIdsForAssembly.add(authChainId);
                }
            }

            // Convert the Set to an array and store it
            assemblyToAuthChains.set(assemblyId, Array.from(authChainIdsForAssembly));
        }

        return {
            labelChainToAssembly,
            authChainToAssembly,
            assemblyToLabelChains,
            assemblyToAuthChains,
        };
    }

    /**
     * Get the assembly ID for a given chain (by auth name)
     */
    export function getAssemblyForChain(mapping: AssemblyMapping | null, authChainId: string): string | null {
        if (!mapping) return null;
        return mapping.authChainToAssembly.get(authChainId) ?? null;
    }

    export function getAssemblyForStep(mapping: AssemblyMapping | null, dnatcofication: Dnatcofication, stepId: number): string | null {
        if (!mapping) return null;

        const step = dnatcofication.data.steps.steps.find(s => s.id === stepId);
        if (!step) {
            Logger.log(Logger.Severity.Warning, `Step with ID ${stepId} not found`);
            return null;
        }

        const assemblyId = getAssemblyForChain(mapping, step.chainAuth);
        return assemblyId;
    }

    export function getAssemblyForBasePair(mapping: AssemblyMapping | null, dnatcofication: Dnatcofication, basePairId: number): string | null {
        if (!mapping) return null;

        const basePair = Dnatcofication.activeBasePairs(dnatcofication.data).pairs.find(bp => bp.id === basePairId);
        if (!basePair) return null;

        // Check both residues - base pairs can span different assemblies
        const assemblyId1 = getAssemblyForChain(mapping, basePair.authAsymId1);
        const assemblyId2 = getAssemblyForChain(mapping, basePair.authAsymId2);

        // If both residues are in different assemblies, this is a cross-assembly pair
        if (assemblyId1 !== assemblyId2) {
            Logger.log(Logger.Severity.Warning, `Base pair ${basePairId} spans different assemblies: ${assemblyId1} and ${assemblyId2}`);
            return null;
        }

        return assemblyId1;
    }
}
