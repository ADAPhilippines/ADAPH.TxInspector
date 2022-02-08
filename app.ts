import express from "express";
import * as Cardano from "@emurgo/cardano-serialization-lib-nodejs";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import config from "./config.json";
import { toHex as toHex } from "./Utils";
import { TransactionUtxos } from "./Types";

const app = express();
const port = 3000;

const blockfrostApi = new BlockFrostAPI({
  projectId: config.BlockfrostProjectId,
});

app.get("/", async (req, res) => {
  try {
    const cbor64 = req.query.txCbor64 as string;
    const txBytes = Buffer.from(cbor64, "base64");
    const tx = Cardano.Transaction.from_bytes(txBytes);
    const txBody = tx.body();

    const rawInputs = txBody.inputs();

    const inputTxUtxos: TransactionUtxos[] = [];

    const inputs: { txId: string; txIdx: number; address: string; amount: { quantity: string; unit: string; }[] }[] = [];
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
        inputs.push({
          txId: txId,
          txIdx: txIdx,
          address: utxo.address,
          amount: utxo.amount
        });
      }
    }

    const outputs = txBody.outputs();
    const resOutputs: {
      address: string,
      amount: {
        quantity: string,
        unit: string
      }[],
      data_hash: string,
    }[] = [];

    for (let i = 0; i < outputs.len(); i++) {
      const output = outputs.get(i);

      const resOutput: any = {
        address: output.address().to_bech32(),

      };

      const resOutputAmount: {
        quantity: string,
        unit: string
      }[] = [];

      resOutputAmount.push({
        unit: "lovelace",
        quantity: output.amount().coin().to_str()
      });

      const multiAssets = output.amount().multiasset();

      if (multiAssets !== undefined) {
        const policyIds = multiAssets.keys(); // policy ids
        if (policyIds !== undefined) {
          for (let j = 0; j < policyIds.len(); j++) {
            const key = policyIds.get(j);
            const assets = multiAssets.get(key);
            if (key !== undefined && assets !== undefined) {
              const assetNames = assets.keys();
              if (assetNames !== undefined) {
                for (let k = 0; k < assetNames.len(); k++) {
                  const assetName = assetNames.get(k);
                  const quantity = assets.get(assetName);
                  if (assetName !== undefined && quantity !== undefined) {
                    resOutputAmount.push({
                      unit: `${toHex(key.to_bytes())}${toHex(assetName.to_bytes())}`,
                      quantity: quantity.to_str()
                    });
                  }
                }
              }
            }
          }
        }
      }

      resOutput.amount = resOutputAmount;
      const dataHash = output.data_hash();
      if (dataHash !== undefined) {
        resOutput.data_hash = toHex(dataHash.to_bytes());
      }

      resOutputs.push(resOutput)
    }

    res.send({
      hash: toHex(Cardano.hash_transaction(txBody).to_bytes()),
      size: txBytes.length,
      fee: txBody.fee().to_str(),
      inputs: inputs,
      metadata: {},
      outputs: resOutputs,
    });
  }
  catch (ex) {
    res.sendStatus(400);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
