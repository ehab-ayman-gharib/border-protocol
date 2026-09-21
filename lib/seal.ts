import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
export const ARSTOVIA_VALID_SEAL_SVG =
  '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" stroke="#675744" stroke-width="3" fill="none"/><circle cx="50" cy="50" r="37" stroke="#675744" stroke-width="1" fill="none" stroke-dasharray="2 3"/><path d="M50 20 58 40 80 42 63 56 69 79 50 66 31 79 37 56 20 42 42 40Z" fill="#675744"/><text x="50" y="55" font-family="monospace" font-size="8" fill="#ede3cb" text-anchor="middle">ARSTOVIA</text></svg>';
export const hashSeal = (raw: string) =>
  bytesToHex(sha256(new TextEncoder().encode(raw)));
export const OFFICIAL_SEAL_HASH = hashSeal(ARSTOVIA_VALID_SEAL_SVG);
