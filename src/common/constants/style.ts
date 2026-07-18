const gapSizes = {
	x4: 4,
	x8: 8,
	x12: 12,
	x16: 16,
	x24: 24,
	x32: 32,
} as const;

const radiusSizes = {
	sm: 8,
	md: 12,
	lg: 16,
} as const;

const fontSizes = {
	sm: 13,
	md: 16,
	lg: 20,
	xl: 28,
} as const;

const lightColors = {
	background: "#fdfdfd",
	backgroundElevated: "#ffffff",
	textPrimary: "#1c2024",
	textSecondary: "#60646c",
	border: "#d9d9e0",
	accent: "#0588f0",
	accentContrast: "#ffffff",
	danger: "#dc3e42",
	dangerContrast: "#ffffff",
} as const;

const darkColors = {
	background: "#111113",
	backgroundElevated: "#19191b",
	textPrimary: "#edeef0",
	textSecondary: "#b0b4ba",
	border: "#3a3a44",
	accent: "#3b9eff",
	accentContrast: "#ffffff",
	danger: "#ec5d5e",
	dangerContrast: "#ffffff",
} as const;

export const themes = {
	light: {
		colors: lightColors,
		gapSizes,
		radiusSizes,
		fontSizes,
	},
	dark: {
		colors: darkColors,
		gapSizes,
		radiusSizes,
		fontSizes,
	},
} as const;

export const breakpoints = {
	xs: 0,
	sm: 380,
	md: 768,
} as const;
