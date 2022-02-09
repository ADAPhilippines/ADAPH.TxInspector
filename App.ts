import express from "express";
import * as Cardano from "@emurgo/cardano-serialization-lib-nodejs";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import config from "./config.json";
import { toHex, getInputsAsync, getOutputs } from "./Utils";

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

    res.send({
      hash: toHex(Cardano.hash_transaction(txBody).to_bytes()),
      inputs: await getInputsAsync(tx, blockfrostApi),
      outputs: getOutputs(tx),
      size: txBytes.length,
      fee: txBody.fee().to_str(),
      metadata: {}
    });
  }
  catch (ex) {
    res.sendStatus(400);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
