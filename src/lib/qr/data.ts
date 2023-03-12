import {
	alphanumList,
	charCap,
	lindex,
	mindex,
	numList,
	requiredBytes,
	groupingList,
	modeIndicator
} from './constants';

// ecl: Error Correction Level(L,M,Q,H)
export function encode(ver: number, ecl: string, str: string): [number, number[][]] {
	const modeEncoding: Record<string, (str: string) => string> = {
		numeric: numericEncoding,
		alphanumeric: alphanumericEncoding,
		byte: byteEncoding,
		kanji: kanjiEncoding
	};

	const [version, mode] = analyse(ver, ecl, str);

	console.log('line 16: mode:', mode);

	let code = modeIndicator[mode] + get_cci(version, mode, str) + modeEncoding[mode](str);

	// Add a Terminator
	const rqbits = 8 * requiredBytes[version - 1][lindex[ecl]];
	let b = rqbits - code.length;
	code += b >= 4 ? '0000' : '0'.repeat(b);

	// Make the Length a Multiple of 8
	while (code.length % 8 !== 0) {
		code += '0';
	}

	// Add Pad Bytes if the String is Still too Short
	while (code.length < rqbits) {
		code += rqbits - code.length >= 16 ? '1110110000010001' : '11101100';
	}

	const dataCode = code.match(/.{1,8}/g)!.map((b) => parseInt(b, 2));

	const g = groupingList[version - 1][lindex[ecl]];
	const dataCodewords: number[][] = [];
	let i = 0;
	for (let n = 0; n < g[0]; n++) {
		dataCodewords.push(dataCode.slice(i, i + g[1]));
		i += g[1];
	}
	for (let n = 0; n < g[2]; n++) {
		dataCodewords.push(dataCode.slice(i, i + g[3]));
		i += g[3];
	}

	return [version, dataCodewords];
}

export function analyse(ver: number, ecl: string, str: string): [number, string] {
	let mode: string;

	if (str.split('').every((i) => numList.includes(i))) {
		mode = 'numeric';
	} else if (str.split('').every((i) => alphanumList.includes(i))) {
		mode = 'alphanumeric';
	} else {
		mode = 'byte';
	}

	const m = mindex[mode];
	const l = str.length;
	for (let i = 0; i < 40; i++) {
		if (charCap[ecl][i][m] > l) {
			ver = i + 1 > ver ? i + 1 : ver;
			break;
		}
	}

	return [ver, mode];
}

export function numericEncoding(str: string): string {
	const strList = str.match(/.{1,3}/g)!;
	let code = '';
	for (const i of strList) {
		let rqbin_len = 10;
		if (i.length === 1) {
			rqbin_len = 4;
		} else if (i.length === 2) {
			rqbin_len = 7;
		}
		const code_temp = parseInt(i).toString(2);
		code += '0'.repeat(rqbin_len - code_temp.length) + code_temp;
	}
	return code;
}

export function alphanumericEncoding(str: string): string {
	const codeList = [];
	for (const i of str) {
		codeList.push(alphanumList.indexOf(i));
	}
	let code = '';
	for (let i = 1; i < codeList.length; i += 2) {
		const c = (codeList[i - 1] * 45 + codeList[i]).toString(2).padStart(11, '0');
		code += c;
	}
	if (codeList.length % 2 !== 0) {
		const c = codeList[codeList.length - 1].toString(2).padStart(6, '0');
		code += c;
	}
	return code;
}

export function byteEncoding(str: string): string {
	let code = '';
	for (const i of str) {
		const c = i.charCodeAt(0).toString(2).padStart(8, '0');
		code += c;
	}
	return code;
}

export function kanjiEncoding(str: string): string {
	// Not implemented yet
	return '';
}

export function get_cci(ver: number, mode: string, str: string): string {
	let cciLen: number;
	if (1 <= ver && ver <= 9) {
		cciLen = [10, 9, 8, 8][mindex[mode]];
	} else if (10 <= ver && ver <= 26) {
		cciLen = [12, 11, 16, 10][mindex[mode]];
	} else {
		cciLen = [14, 13, 16, 12][mindex[mode]];
	}

	const cci = str.length.toString(2);
	return '0'.repeat(cciLen - cci.length) + cci;
}

if (require.main === module) {
	const s = '123456789';
	const [v, datacode] = encode(1, 'H', s);
	console.log(v, datacode);
}
