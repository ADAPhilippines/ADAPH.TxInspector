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

export type Address = {
  address: string;
  amount: {
    unit: string;
    quantity: string;
  }[];
  stake_address: string | null;
  type: "byron" | "shelley";
  script: boolean;
}

export type TxInput = {
  txId: string;
  txIdx: number;
  address: string;
  stakeAddress: string;
  amount: {
    quantity: string;
    unit: string;
  }[]
}

export type TxOutput = {
  address: string,
  stakeAddress: string,
  amount: {
    quantity: string,
    unit: string
  }[],
  data_hash: string | null,
}

export type Amount = {
  quantity: string,
  unit: string
}