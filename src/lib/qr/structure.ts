export function structureFinalBits(
	ver: number,
	ecl: string,
	dataCodewords: number[],
	ecc: number[][]
): string {
	const final_message = interleaveDc(ver, ecl, dataCodewords).concat(interleaveEcc(ecc));

	// Convert to binary & Add Remainder Bits if Necessary
	const requiredRemainderBits = [0, 7, 7, 7][ver - 1];
	const finalBits = final_message
		.map((value) => ('00000000' + value.toString(2)).slice(-8))
		.join('')
		.concat('0'.repeat(requiredRemainderBits));

	return finalBits;
}

export function interleaveDc(ver: number, ecl: string, dataCodewords: number[]): number[] {
	const id: number[] = [];
	const lindex: { [key: string]: number } = { L: 0, M: 1, Q: 2, H: 3 };
	const grouping_list: number[][][] = [
		[
			[1, 10, 9, 8],
			[1, 16, 13, 9],
			[1, 22, 17, 10],
			[1, 28, 22, 12]
		],
		[
			[1, 12, 11, 10],
			[1, 20, 15, 11],
			[1, 28, 21, 12],
			[1, 36, 27, 14]
		],
		[
			[1, 14, 13, 12],
			[1, 26, 19, 14],
			[1, 36, 26, 15],
			[1, 46, 34, 16]
		],
		[
			[1, 16, 15, 14],
			[1, 36, 26, 19],
			[1, 52, 38, 22],
			[1, 72, 52, 24]
		],
		[
			[1, 18, 17, 16],
			[1, 46, 34, 26],
			[2, 42, 31, 20],
			[2, 62, 45, 28]
		],
		[
			[2, 20, 19, 18],
			[1, 66, 50, 36],
			[2, 58, 43, 24],
			[2, 86, 62, 32]
		],
		[
			[2, 22, 21, 20],
			[2, 86, 64, 48],
			[4, 69, 50, 28],
			[2, 100, 72, 36]
		],
		[
			[2, 24, 23, 22],
			[2, 106, 81, 60],
			[4, 84, 60, 36],
			[4, 122, 88, 44]
		],
		[
			[2, 26, 25, 24],
			[4, 116, 90, 68],
			[4, 105, 74, 44],
			[4, 152, 110, 56]
		],
		[
			[2, 28, 27, 26],
			[4, 136, 105, 78],
			[4, 147, 106, 48],
			[4, 176, 130, 64]
		],
		[
			[2, 30, 29, 28],
			[4, 156, 120, 90],
			[5, 109, 80, 36],
			[5, 198, 146, 72]
		]
	];

	const g = grouping_list[ver - 1][lindex[ecl]];
	if (g[3]) {
		for (let i = 0; i < g[2]; i++) {
			id.push(dataCodewords[i - g[2]][dataCodewords[i - g[2]].length - 1]);
		}
	}

	for (let t = 0; t < g[1]; t++) {
		for (let j = 0; j < g[0]; j++) {
			id.push(dataCodewords[t][j]);
		}
	}

	return id;
}

export function interleaveEcc(ecc: number[][]): number[] {
	const ie: number[] = [];
	for (let t = 0; t < ecc[0].length; t++) {
		for (let j = 0; j < ecc.length; j++) {
			ie.push(ecc[j][t]);
		}
	}
	return ie;
}
