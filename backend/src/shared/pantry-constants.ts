export const PANTRY_CATEGORIES = [
	'OTHER',
	'GRAINS',
	'DAIRY',
	'VEGETABLES',
	'FRUITS',
	'MEAT',
	'FROZEN',
	'CONDIMENTS',
	'BEVERAGES',
] as const;

export type PantryCategory = (typeof PANTRY_CATEGORIES)[number];

export const UNITS = ['KG', 'L', 'ML', 'G', 'LOAF', 'JAR', 'UNITS'] as const;
export type Unit = (typeof UNITS)[number];
