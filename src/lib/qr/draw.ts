import * as os from 'os';
import { Image } from 'image-lib'; // assuming image-lib is a package with an Image class implementation

export function drawQrcode(abspath: string, qrmatrix: boolean[][]): string {
	const unitLen = 3;
	let x: number = 4 * unitLen;
	let y: number = 4 * unitLen;
	const pic: Image = new Image(
		'1',
		[(qrmatrix.length + 8) * unitLen, (qrmatrix.length + 8) * unitLen],
		'white'
	);

	for (const line of qrmatrix) {
		for (const module of line) {
			if (module) {
				drawABlackUnit(pic, x, y, unitLen);
			}
			x += unitLen;
		}
		x = 4 * unitLen;
		y += unitLen;
	}

	const saving: string = os.path.join(abspath, 'qrcode.png');
	pic.save(saving);
	return saving;
}

export function drawABlackUnit(p: Image, x: number, y: number, ul: number): void {
	for (let i = 0; i < ul; i++) {
		for (let j = 0; j < ul; j++) {
			p.putpixel([x + i, y + j], 0);
		}
	}
}
