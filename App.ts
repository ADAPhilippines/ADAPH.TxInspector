import express from "express";
import * as Cardano from "@emurgo/cardano-serialization-lib-nodejs";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { toHex, getInputsAsync, getOutputsAsync } from "./Utils";

const app = express();
const port = process.env.PORT || 1337;

const blockfrostApi = new BlockFrostAPI({
  projectId: process.env.BLOCKFROST_PROJECT_ID as string,
});

app.get("/", async (req, res) => {
  try {
    const cbor64 = req.query.txCbor64 as string;
    const txBytes = Buffer.from(cbor64, "base64");
    const tx = Cardano.Transaction.from_bytes(txBytes);
    const txBody = tx.body();
    const txHash = toHex(Cardano.hash_transaction(txBody).to_bytes());
    console.log(new Date(), "Inspection request, TxId: " + txHash);

    res.send({
      hash: txHash,
      inputs: await getInputsAsync(tx, blockfrostApi),
      outputs: await getOutputsAsync(tx),
      size: txBytes.length,
      fee: txBody.fee().to_str(),
      metadata: {}
    });
  }
  catch (ex) {
    console.error(new Date(), ex);
    res.sendStatus(400);
  }
});

app.listen(port, () => {
  console.log(new Date(), `Welcome to ADAPH.TxInspector, listening on port: ${port}`);
});