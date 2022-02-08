export type TransactionUtxos = { 
    hash: string; 
    inputs: { 
        address: string; 
        amount: { unit: string; quantity: string; }[]; 
        tx_hash: string; 
        output_index: number; 
        data_hash: string | null; 
        collateral: boolean; 
    }[]; 
    outputs: { 
        address: string; 
        amount: { unit: string; quantity: string; }[]; 
        output_index: number; 
        data_hash: string | null; 
    }[]; 
}