import { aligLocation, formatInfoStr, lindex, versionInfoStr } from './constants';

export function getQrmatrix(ver: number, ecl: string, bits: string): number[][] {
	const num = (ver - 1) * 4 + 21;
	const qrmatrix = Array.from(Array(num), () => Array(num).fill(null));

	// Add the Finder Patterns & Add the Separators
	addFinderAndSeparator(qrmatrix);

	// Add the Alignment Patterns
	addAlignment(ver, qrmatrix);

	// Add the Timing Patterns
	addTiming(qrmatrix);

	// Add the Dark Module and Reserved Areas
	addDarkAndReserving(ver, qrmatrix);

	const maskmatrix = qrmatrix.map((x) => [...x]);

	// Place the Data Bits
	placeBits(bits, qrmatrix);

	// Data Masking
	const [maskNum, maskedQrmatrix] = mask(maskmatrix, qrmatrix);

	// Format Information
	addFormatAndVersionString(ver, ecl, maskNum, maskedQrmatrix);

	return maskedQrmatrix;
}

export function addFinderAndSeparator(m: number[][]): void {
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			if (i === 0 || i === 6) {
				m[i][j] = m[m.length - i - 1][j] = m[i][m.length - j - 1] = j === 7 ? 0 : 1;
			} else if (i === 1 || i === 5) {
				m[i][j] = m[m.length - i - 1][j] = m[i][m.length - j - 1] = j === 0 || j === 6 ? 1 : 0;
			} else if (i === 7) {
				m[i][j] = m[m.length - i - 1][j] = m[i][m.length - j - 1] = 0;
			} else {
				m[i][j] =
					m[m.length - i - 1][j] =
					m[i][m.length - j - 1] =
						j === 1 || j === 5 || j === 7 ? 0 : 1;
			}
		}
	}
}

export function addAlignment(ver: number, m: number[][]): void {
	if (ver > 1) {
		const coordinates = aligLocation[ver - 2];
		for (let i of coordinates) {
			for (let j of coordinates) {
				if (m[i][j] === null) {
					addAnAlignment(i, j, m);
				}
			}
		}
	}
}

export function addAnAlignment(row: number, column: number, m: number[][]): void {
	for (let i = row - 2; i < row + 3; i++) {
		for (let j = column - 2; j < column + 3; j++) {
			m[i][j] = i === row - 2 || i === row + 2 || j === column - 2 || j === column + 2 ? 1 : 0;
		}
	}
	m[row][column] = 1;
}

export function addTiming(m: number[][]) {
	for (let i = 8; i < m.length - 8; i++) {
		m[i][6] = m[6][i] = i % 2 === 0 ? 1 : 0;
	}
}

export function addDarkAndReserving(ver: number, m: number[][]) {
	for (let j = 0; j < 8; j++) {
		m[8][j] = m[8][m.length - j - 1] = m[j][8] = m[m.length - j - 1][8] = 0;
	}
	m[8][8] = 0;
	m[8][6] = m[6][8] = m[m.length - 8][8] = 1;

	if (ver > 6) {
		for (let i = 0; i < 6; i++) {
			for (let j of [-9, -10, -11]) {
				m[i][j] = m[j][i] = 0;
			}
		}
	}
}

export function placeBits(bits: string, m: number[][]) {
	const bit = (function* () {
		for (let i of bits) {
			yield parseInt(i);
		}
	})();

	let up = true;
	for (let a = m.length - 1; a > 0; a -= 2) {
		a = a <= 6 ? a - 1 : a;
		const irange = up ? [...Array(m.length).keys()].reverse() : [...Array(m.length).keys()];
		for (let i of irange) {
			for (let j of [a, a - 1]) {
				if (m[i][j] === null) {
					m[i][j] = bit.next().value;
				}
			}
		}
		up = !up;
	}
}

export function mask(mm: number[][], m: number[][]) {
	const mps = getMaskPatterns(mm);
	const scores: number[] = [];

	for (let mp of mps) {
		for (let i = 0; i < mp.length; i++) {
			for (let j = 0; j < mp.length; j++) {
				mp[i][j] = mp[i][j] ^ m[i][j];
			}
		}
		scores.push(computeScore(mp));
	}

	const best = scores.indexOf(Math.min(...scores));
	return [best, mps[best]];
}

export function getMaskPatterns(mm: number[][]) {
	function formula(i: number, row: number, column: number) {
		if (i === 0) {
			return (row + column) % 2 === 0;
		} else if (i === 1) {
			return row % 2 === 0;
		} else if (i === 2) {
			return column % 3 === 0;
		} else if (i === 3) {
			return (row + column) % 3 === 0;
		} else if (i === 4) {
			return (row >> 1) + ((column / 3) % 2) === 0;
		} else if (i === 5) {
			return ((row * column) % 2) + ((row * column) % 3) === 0;
		} else if (i === 6) {
			return (((row * column) % 2) + ((row * column) % 3)) % 2 === 0;
		} else if (i === 7) {
			return (((row + column) % 2) + ((row * column) % 3)) % 2 === 0;
		}
	}

	mm[mm.length - 8][8] = null;
	for (let i = 0; i < mm.length; i++) {
		for (let j = 0; j < mm.length; j++) {
			mm[i][j] = mm[i][j] !== null ? 0 : mm[i][j];
		}
	}
	const mps = [];

	for (let i = 0; i < 8; i++) {
		const mp = mm.map((row) => [...row]);
		for (let row = 0; row < mp.length; row++) {
			for (let column = 0; column < mp.length; column++) {
				mp[row][column] = mp[row][column] === null && formula(i, row, column) ? 1 : 0;
			}
		}
		mps.push(mp);
	}

	return mps;
}

export function computeScore(m: number[][]) {
	function evaluation1(m: number[][]) {
		function ev1(ma: number[][]) {
			let sc = 0;
			for (let mi of ma) {
				let j = 0;
				while (j < mi.length - 4) {
					let n = 4;
					while (
						mi.slice(j, j + n + 1).every((v) => v === 1) ||
						mi.slice(j, j + n + 1).every((v) => v === 0)
					) {
						n++;
					}
					[sc, j] = n > 4 ? [sc + n - 2, j + n] : [sc, j + 1];
				}
			}
			return sc;
		}
		return ev1(m) + ev1(m[0].map((_, i) => m.map((row) => row[i])));
	}

	function evaluation2(m: number[][]) {
		let sc = 0;
		for (let i = 0; i < m.length - 1; i++) {
			for (let j = 0; j < m.length - 1; j++) {
				sc +=
					m[i][j] === m[i + 1][j] && m[i][j + 1] === m[i + 1][j + 1] && m[i][j] === m[i][j + 1]
						? 3
						: 0;
			}
		}
		return sc;
	}

	function evaluation3(m: number[][]) {
		function ev3(ma: number[][]) {
			let sc = 0;
			for (let mi of ma) {
				let j = 0;
				while (j < mi.length - 10) {
					if (mi.slice(j, j + 11).every((v, k) => v === [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0][k])) {
						sc += 40;
						j += 7;
					} else if (
						mi.slice(j, j + 11).every((v, k) => v === [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1][k])
					) {
						sc += 40;
						j += 4;
					} else {
						j++;
					}
				}
			}
			return sc;
		}
		return ev3(m) + ev3(m[0].map((_, i) => m.map((row) => row[i])));
	}

	function evaluation4(m: number[][]) {
		const darknum = m.reduce((acc, val) => acc + val.reduce((a, v) => a + v, 0), 0);
		const percent = (darknum / m.length ** 2) * 100;
		const s = Math.floor((50 - percent) / 5) * 5;
		return s >= 0 ? s * 2 : -s * 2;
	}

	const score = evaluation1(m) + evaluation2(m) + evaluation3(m) + evaluation4(m);
	return score;
}

export function addFormatAndVersionString(
	ver: number,
	ecl: string,
	mask_num: number,
	m: number[][]
) {
	const fs = formatInfoStr[lindex[ecl]][mask_num].split('').map(Number);
	for (let j = 0; j < 6; j++) {
		m[8][j] = m[m.length - j - 1][8] = fs[j];
		m[8][m.length - j - 1] = m[j][8] = fs[5 - j];
	}
	m[8][7] = m[m.length - 7][8] = fs[6];
	m[8][8] = m[8][m.length - 8] = fs[7];
	m[7][8] = m[8][m.length - 7] = fs[8];

	if (ver > 6) {
		const vs = versionInfoStr[ver - 7].split('').map(Number);
		for (let j = 5; j >= 0; j--) {
			for (let i of [-9, -10, -11]) {
				m[i][j] = m[j][i] = vs.shift() as number;
			}
		}
	}
}
