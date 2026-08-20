// `hairlineWidth` is React Native's, not Unistyles' — the two `StyleSheet`s are
// unrelated, so both are imported and the React Native one is aliased. every
// stylesheet in the app still uses the Unistyles export below.
import { StyleSheet as ReactNativeStyleSheet } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const gap = {
	xs: 8,
	sm: 12,
	md: 16,
	lg: 24,
	xl: 32,
} as const;

// corner radii, each step named for the role a surface plays rather than for
// its value, so a surface picks by role instead of by eye.
//
// deliberately its own family rather than steps borrowed from `gap`: a radius
// is not a spacing step, and while the two scales happen to share numbers
// today, folding them together means retuning spacing silently reshapes every
// corner in the app.
const radius = {
	// inset marks and placeholder bars — a collection card's icon tile, a
	// skeleton bar.
	sm: 8,
	// the default surface corner: cards, inputs, buttons, menu-group ends.
	md: 12,
	// large marks — a message state's icon plate.
	lg: 16,
	// fully rounded. React Native clamps a radius to half the shorter side, so
	// one step covers both a pill (the record-id chip) and a circle (the account
	// avatar) without either naming a measurement of its own.
	pill: 999,
} as const;

// `hairline` is the thinnest line the display can actually draw — a third of a
// point on a 3x screen, where the literal `1` it replaced was three physical
// pixels. `thin` is the step up, for a border meant to read as a weight rather
// than as a separator; nothing consumes it yet, and it is declared so that the
// next surface needing one picks a step instead of inventing a number.
const borderWidth = {
	hairline: ReactNativeStyleSheet.hairlineWidth,
	thin: 1,
} as const;

// named by magnitude rather than by milliseconds, so retuning a step does not
// turn its name into a lie. `fast` and `base` are the interaction tier and are
// declared ahead of their first consumer, for the same reason `thin` is.
const duration = {
	fast: 150,
	base: 250,
	// the skeleton pulse — an ambient cadence rather than a response to a tap.
	slow: 700,
} as const;

// the app's one motion curve. role-named, so retuning the curve neither renames
// the token nor makes it false — which `standard` survives and `easeInOutQuad`
// would not.
//
// written out rather than imported as reanimated's `Easing.inOut(Easing.quad)`:
// this module is the root layout's first import and a `setupFiles` entry in
// jest.config.cjs, so importing `react-native-reanimated` here would load the
// real native module — failing every jest suite and pulling reanimated's native
// initialization into the app's first tick. the curve below is that same
// ease-in-out quad, which is also the default `withTiming` already applies, so
// naming it explicitly changes no existing animation.
//
// the `"worklet"` directive is what lets reanimated run this on the UI thread.
// `babel-preset-expo` transforms it through react-native-worklets' plugin,
// which attaches the worklet metadata inline and adds no module-scope require,
// so the directive costs this module nothing at load time.
const easing = {
	standard: (t: number): number => {
		"worklet";

		return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
	},
} as const;

// the bundled font files. deliberately module-private rather than a theme
// token: a family without its size is half a typography decision, and exposing
// one invites a style to pick a family and then invent a size. every text style
// goes through `typography` below.
const fonts = {
	heading: "InnovatorGrotesk-SemiBold",
	paragraph: "InnovatorGrotesk-Regular",
	monospace: "JetBrainsMono-Regular",
} as const;

// composite text roles, named for the content they carry rather than their
// size. a style applies a role whole — `...theme.typography.body` — instead of
// picking values out of it, so family, size, and line height can never drift
// apart across screens.
//
// weight is not a field here: the bundled families encode it in the file name
// (InnovatorGrotesk-SemiBold vs -Regular), and pairing a weight-bearing family
// with an explicit `fontWeight` makes React Native synthesize a second weight
// on top of the real one.
//
// 22 is the shared line box of every role that fills a title or body line
// (`heading`, `body`, `code`). that is what keeps a record card's height
// deterministic — see `RECORD_CARD_LINE` in collection-record-card.tsx.
const typography = {
	// a screen's hero title — the Home landing.
	display: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34 },
	// the title of a centered message state (empty, error, placeholder).
	title: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26 },
	// body metrics, emphasized: button labels, card titles, section headings.
	heading: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 22 },
	// default running text: body copy, text inputs, list row labels.
	body: { fontFamily: fonts.paragraph, fontSize: 16, lineHeight: 22 },
	// anything supporting something else: a form field's name, hints, errors,
	// counts, metadata. one role rather than a separate `label`, because the two
	// carried identical values and naming them apart implied a distinction the
	// design does not draw.
	caption: { fontFamily: fonts.paragraph, fontSize: 13, lineHeight: 18 },
	// machine-readable text: a record id standing in for a missing title, an id
	// chip, build details.
	code: { fontFamily: fonts.monospace, fontSize: 14, lineHeight: 22 },
	// machine-readable text supporting something else: a record field's Payload
	// name, shown beside the label derived from it. it borrows `caption`'s 18pt
	// line box, which is what lets the two sit on one shared baseline.
	codeCaption: { fontFamily: fonts.monospace, fontSize: 12, lineHeight: 18 },
} as const;

// semantic color roles mirror axross/cunnpe's theme structure
// (foundation / surface / border / solid / text, each × neutral / accent /
// destructive). neutral is Radix Slate and destructive is Radix Ruby, as in
// cunnpe; the accent scale is Radix Teal. `text.onAccent` is the one field
// Nakami adds beyond cunnpe's structure — cunnpe never draws text on a solid
// accent fill, but Nakami's filled buttons do (Radix teal pairs with white).
const defaultTheme = {
	borderWidth,
	colors: {
		foundation: {
			neutral: {
				// slate-1
				bare: "#fcfcfd",
				// slate-2
				subtle: "#f9f9fb",
			},
			accent: {
				// teal-1
				bare: "#fafefd",
				// teal-2
				subtle: "#f3fbf9",
			},
			destructive: {
				// ruby-1
				bare: "#fffcfd",
				// ruby-2
				subtle: "#fff7f8",
			},
		},
		surface: {
			neutral: {
				// slate-3
				base: "#f0f0f3",
				// slate-5
				highlight: "#e0e1e6",
			},
			accent: {
				// teal-3
				base: "#e0f8f3",
				// teal-5
				highlight: "#b8eae0",
			},
			destructive: {
				// ruby-3
				base: "#feeaed",
				// ruby-5
				highlight: "#ffced6",
			},
		},
		border: {
			neutral: {
				// slate-6
				subtle: "#d9d9e0",
				// slate-7
				base: "#cdced6",
				// slate-8
				intense: "#b9bbc6",
			},
			accent: {
				// teal-6
				subtle: "#a1ded2",
				// teal-7
				base: "#83cdc1",
				// teal-8
				intense: "#53b9ab",
			},
			destructive: {
				// ruby-6
				subtle: "#f8bfc8",
				// ruby-7
				base: "#efacb8",
				// ruby-8
				intense: "#e592a3",
			},
		},
		solid: {
			neutral: {
				// slate-9
				base: "#8b8d98",
				// slate-10
				intense: "#80838d",
			},
			accent: {
				// teal-9
				base: "#12a594",
				// teal-10
				intense: "#0d9b8a",
				// teal-9 alpha
				baseAlpha: "#12a5949c",
				// teal-10 alpha
				intenseAlpha: "#0d9b8ab3",
			},
			destructive: {
				// ruby-9
				base: "#e54666",
				// ruby-10
				intense: "#dc3b5d",
			},
		},
		text: {
			neutral: {
				// slate-11
				base: "#60646c",
				// slate-12
				intense: "#1c2024",
			},
			accent: {
				// teal-11
				base: "#008573",
				// teal-12
				intense: "#0d3d38",
			},
			destructive: {
				// ruby-11
				base: "#ca244d",
				// ruby-12
				intense: "#64172b",
			},
			// text drawn on top of a solid accent fill (Radix teal contrast)
			onAccent: "#ffffff",
		},
	},
	duration,
	easing,
	gap,
	radius,
	typography,
};

type ThemeName = "light" | "dark";
type Theme = typeof defaultTheme;

const themes: Record<ThemeName, Theme> = {
	light: defaultTheme,
	dark: {
		...defaultTheme,
		colors: {
			foundation: {
				neutral: {
					// slate-1
					bare: "#111113",
					// slate-2
					subtle: "#18191b",
				},
				accent: {
					// teal-1
					bare: "#0d1514",
					// teal-2
					subtle: "#111c1b",
				},
				destructive: {
					// ruby-1
					bare: "#191113",
					// ruby-2
					subtle: "#1e1517",
				},
			},
			surface: {
				neutral: {
					// slate-3
					base: "#212225",
					// slate-5
					highlight: "#2e3135",
				},
				accent: {
					// teal-3
					base: "#0d2d2a",
					// teal-5
					highlight: "#084843",
				},
				destructive: {
					// ruby-3
					base: "#3a141e",
					// ruby-5
					highlight: "#5e1a2e",
				},
			},
			border: {
				neutral: {
					// slate-6
					subtle: "#363a3f",
					// slate-7
					base: "#43484e",
					// slate-8
					intense: "#5a6169",
				},
				accent: {
					// teal-6
					subtle: "#145750",
					// teal-7
					base: "#1c6961",
					// teal-8
					intense: "#207e73",
				},
				destructive: {
					// ruby-6
					subtle: "#6f2539",
					// ruby-7
					base: "#883447",
					// ruby-8
					intense: "#b3445a",
				},
			},
			solid: {
				neutral: {
					// slate-9
					base: "#696e77",
					// slate-10
					intense: "#777b84",
				},
				accent: {
					// teal-9
					base: "#12a594",
					// teal-10
					intense: "#0eb39e",
					// teal-9 alpha
					baseAlpha: "#12a594ed",
					// teal-10 alpha
					intenseAlpha: "#0eb39eed",
				},
				destructive: {
					// ruby-9
					base: "#e54666",
					// ruby-10
					intense: "#ec5a72",
				},
			},
			text: {
				neutral: {
					// slate-11
					base: "#b0b4ba",
					// slate-12
					intense: "#edeef0",
				},
				accent: {
					// teal-11
					base: "#0bd8b6",
					// teal-12
					intense: "#adf0dd",
				},
				destructive: {
					// ruby-11
					base: "#ff949d",
					// ruby-12
					intense: "#fed2e1",
				},
				// text drawn on top of a solid accent fill (Radix teal contrast)
				onAccent: "#ffffff",
			},
		},
	},
};

export { themes };

export const breakpoints = {
	xs: 0,
	sm: 380,
	md: 768,
} as const;

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof themes;

declare module "react-native-unistyles" {
	export interface UnistylesThemes extends AppThemes {}
	export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
	settings: {
		adaptiveThemes: true,
	},
	breakpoints,
	themes,
});
