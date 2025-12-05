import { verifyIsString } from './function-verify-string';

describe('verifyIsString', () => {
	it('should return true for string', () => {
		expect(verifyIsString('test')).toBe(true);
	});

	it('should return false for number', () => {
		expect(verifyIsString(123)).toBe(false);
	});

	it('should return false for object', () => {
		expect(verifyIsString({})).toBe(false);
	});

	it('should return false for null', () => {
		expect(verifyIsString(null)).toBe(false);
	});

	it('should return false for undefined', () => {
		expect(verifyIsString(undefined)).toBe(false);
	});
});
