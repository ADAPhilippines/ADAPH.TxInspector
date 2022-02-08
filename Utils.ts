export const toHex = (input: Uint8Array) => {
  return Buffer.from(input).toString("hex");
}