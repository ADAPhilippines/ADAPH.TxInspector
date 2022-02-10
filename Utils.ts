import * as Cardano from "@emurgo/cardano-serialization-lib-nodejs";
import { TransactionUtxos, Address, TxInput, TxOutput, Amount } from "./Types";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import fetch from 'node-fetch';

export const toHex = (input: Uint8Array) => {
  return Buffer.from(input).toString("hex");
}

export const getInputsAsync = async (tx: Cardano.Transaction, blockfrostApi: BlockFrostAPI) => {
  const txBody = tx.body();
  const rawInputs = txBody.inputs();
  const inputTxUtxos: TransactionUtxos[] = [];
  const addresses: Address[] = [];
  const inputs: TxInput[] = [];

  for (let i = 0; i < rawInputs.len(); i++) {
    const input = rawInputs.get(i);
    const txId = toHex(input.transaction_id().to_bytes());
    const txIdx = input.index();

    let inputTxUtxo = inputTxUtxos.find(tx => tx.hash == txId);
    if (inputTxUtxo === undefined) {
      inputTxUtxo = await blockfrostApi.txsUtxos(txId);
      inputTxUtxos.push(inputTxUtxo);
    }

    const utxo = inputTxUtxo.outputs.find(o => o.output_index == txIdx);

    if (utxo !== undefined) {
      let addressInfo = addresses.find(a => a.address == utxo.address);
      if (addressInfo === undefined) {
          const result = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${utxo.address.trim()}`, {
            headers: {
              "project_id": process.env.BLOCKFROST_PROJECT_ID
            } as any,
            method: "GET"
          });
          addressInfo = await result.json() as Address;
        if (addressInfo !== undefined)
          addresses.push(addressInfo);
      }

      inputs.push({
        txId: txId,
        txIdx: txIdx,
        address: utxo.address,
        stakeAddress: addressInfo.stake_address ?? "",
        amount: utxo.amount
      });
    }
  }

  return inputs;
}

export const getOutputs = (tx: Cardano.Transaction) => {
  const txBody = tx.body();
  const rawOutputs = txBody.outputs();
  const outputs: TxOutput[] = [];

  for (let i = 0; i < rawOutputs.len(); i++) {
    const rawOutput = rawOutputs.get(i);
    const utxoAssets: Amount[] = [];

    utxoAssets.push({
      unit: "lovelace",
      quantity: rawOutput.amount().coin().to_str()
    });

    const multiAssets = rawOutput.amount().multiasset();

    if (multiAssets !== undefined) {
      const policyIds = multiAssets.keys(); // policy ids

      for (let j = 0; j < policyIds.len(); j++) {
        const key = policyIds.get(j);
        const assets = multiAssets.get(key);

        if (assets !== undefined) {
          const assetNames = assets.keys();

          for (let k = 0; k < assetNames.len(); k++) {
            const assetName = assetNames.get(k);
            const quantity = assets.get(assetName);

            if (quantity !== undefined) {
              utxoAssets.push({
                unit: `${toHex(key.to_bytes())}${toHex(assetName.to_bytes())}`,
                quantity: quantity.to_str()
              });
            }
          }
        }
      }
    }

    const rawDataHash = rawOutput.data_hash();
    let dataHash: string | null = null;
    if (rawDataHash !== undefined) {
      dataHash = toHex(rawDataHash.to_bytes());
    }

    outputs.push({
      amount: utxoAssets,
      address: rawOutput.address().to_bech32(),
      data_hash: dataHash
    });
  }
  return outputs;
}