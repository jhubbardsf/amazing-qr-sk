import { GP_list, lindex, eccNumPerBlock, log, po2 } from './constants';

//ecc: Error Correction Codewords
export function encode(ver: number, ecl: string, dataCodewords: number[][]): number[][] {
	const en = eccNumPerBlock[ver - 1][lindex[ecl]];
	const ecc: number[][] = [];
	for (const dc of dataCodewords) {
		ecc.push(getEcc(dc, en));
	}
	return ecc;
}

export function getEcc(dc: number[], eccNum: number): number[] {
	const gp = GP_list[eccNum];
	let remainder = dc;
	for (let i = 0; i < dc.length; i++) {
		remainder = divide(remainder, ...gp);
	}
	return remainder;
}

export function divide(MP: Array<number>, ...GP: Array<number>): Array<number> {
	if (MP[0]) {
		GP = [...GP];
		for (let i = 0; i < GP.length; i++) {
			GP[i] += log[MP[0]] || 0; // Not sure about this
			if (GP[i] > 255) {
				GP[i] %= 255;
			}
			GP[i] = po2[GP[i]];
		}
		return XOR(GP, ...MP);
	} else {
		return XOR(Array(GP.length).fill(0), ...MP);
	}
}
export function XOR(GP: number[], ...MP: number[]): number[] {
	let a = MP.length - GP.length;
	if (a < 0) {
		MP.push(...Array(-a).fill(0));
	} else if (a > 0) {
		GP.push(...Array(a).fill(0));
	}

	const remainder: number[] = [];
	for (let i = 1; i < MP.length; i++) {
		remainder.push(MP[i] ^ GP[i]);
	}
	return remainder;
}
