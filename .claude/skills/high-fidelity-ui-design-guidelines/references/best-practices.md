# High-Fidelity UI & Visual Design — Research-Grounded Best Practices

This is a distilled, citable reference for **high-fidelity UI and visual design**, synthesized from a fan-out review of 66 reputable sources (Nielsen Norman Group, Material Design 3, Apple Human Interface Guidelines, W3C/WAI WCAG, the Interaction Design Foundation, Laws of UX, Smashing Magazine, shadcn/ui, and peer HCI literature). It records the external field consensus that grounds this skill's normative rules; the MUST/SHOULD guidance in [SKILL.md](../SKILL.md) remains authoritative, and design-token *values* stay owned by the project's component guidelines and `src/common/constants/style.ts`. Treat this as background reading — reconcile against the source list before citing a specific claim.

**Field consensus in one paragraph.** The field converges on a clear playbook for high-fidelity UI: express meaning through layered semantic design tokens rather than raw values, build clear visual hierarchy with restrained type/size/contrast, ground everything in an 8px spacing and grid rhythm, and make accessibility (contrast, target size, focus, non-color cues) a construction constraint rather than a finishing check. Interactive elements must look interactive and expose complete, differentiated states; color, dark mode, and motion must adapt to user and system preferences; and visual polish must reinforce — never substitute for — usability.

## Principles

1. **Drive every visual value through layered semantic design tokens** — Structure tokens in three tiers — primitive/reference (raw hex, px), semantic/system (role-based: color-action-primary, on-surface), and component — and have components reference only the semantic layer. Name by purpose not appearance so a rebrand or theme swap is a remap, not a rewrite, and pair every surface token with its matching on-/foreground token engineered to clear contrast. [[9]](#sources) [[11]](#sources) [[13]](#sources) [[14]](#sources) [[22]](#sources) [[23]](#sources) [[25]](#sources) [[26]](#sources)
2. **Establish a deliberate visual hierarchy and validate it with a squint test** — Use size, weight, contrast, and position together to signal importance, but limit yourself to a few distinct sizes and contrast levels — if everything is emphasized, nothing stands out. Keep no more than ~2 dominant elements per view and confirm the intended reading order survives by blurring the design or viewing it in grayscale. [[1]](#sources) [[2]](#sources) [[3]](#sources) [[4]](#sources)
3. **Group with proximity, whitespace, and common region before adding lines** — Related items read as a unit when placed close together; distinct groups need larger gaps. Prefer spacing and shared containers (cards, panels, backgrounds) to convey grouping and multi-level structure, adding borders only when whitespace alone is insufficient — this reduces clutter while still communicating relationships. [[2]](#sources) [[5]](#sources) [[6]](#sources) [[30]](#sources)
4. **Build a semantic type scale, not ad-hoc sizes** — Adopt a small set of named type roles (display/headline/title/body/label, or the platform's semantic text styles), each bundling size, weight, line height, and letter spacing. Assign roles by content importance rather than manually enlarging body text, and express emphasis through weight plus size so hierarchy stays consistent and themeable. [[4]](#sources) [[17]](#sources) [[18]](#sources)
5. **Tune body text for readability: size, measure, and leading** — Set comfortable body sizes (roughly 15–25px on screen, 11pt minimum on mobile), keep line length around 50–75 characters (cap at 80), and set line-height to ~120–145% (default to ~1.5). Use clean typefaces on plain high-contrast backgrounds, and let text reflow so overriding spacing never clips content. [[15]](#sources) [[16]](#sources) [[19]](#sources) [[20]](#sources) [[21]](#sources) [[47]](#sources)
6. **Anchor all layout to an 8px baseline grid and a responsive column grid** — Make every margin, padding, and dimension a multiple of a 4/8px base unit so type, spacing, and iconography share one dimensional language and vertical rhythm stays consistent. Use a responsive column grid (e.g. 4/8/12 columns across phone/tablet/desktop) with defined margins and gutters instead of hand-placing elements, and scale section spacing up on larger viewports. [[3]](#sources) [[7]](#sources) [[27]](#sources) [[28]](#sources) [[29]](#sources) [[31]](#sources)
7. **Respect safe areas and design adaptively across device sizes** — Anchor content to layout guides and the safe area so it clears notches, the Dynamic Island, home indicator, and rounded corners, keeping primary content and actions visible without scrolling. Use size classes and reflow so one layout scales gracefully across the smallest to largest devices and orientations. [[7]](#sources) [[30]](#sources)
8. **Meet contrast minimums for text and non-text UI, per theme** — Hold at least 4.5:1 for normal text and 3:1 for large text, and 3:1 for the parts of controls, borders, icons, and state indicators needed to identify them. Never round up to the threshold, recalculate every pairing separately for light and dark (including the lightest elevated surface text can land on), and treat APCA as supplementary readability guidance while WCAG 2 remains the baseline. [[8]](#sources) [[10]](#sources) [[12]](#sources) [[13]](#sources) [[37]](#sources) [[45]](#sources)
9. **Never encode meaning in color alone** — Pair every color cue with a redundant signal — icon, text label, shape, stroke, weight, or pattern — so colorblind and low-vision users get the information. Run a grayscale test to confirm every state, status, and interactive affordance stays distinguishable when hue is removed. [[1]](#sources) [[10]](#sources) [[14]](#sources) [[62]](#sources)
10. **Size and space touch targets for real fingers** — Meet platform floors — 44pt on iOS, 48dp on Android, 24px as the absolute WCAG AA web minimum — and prefer the larger value; enlarge primary and edge/corner actions further. Keep at least ~8dp between adjacent targets, and remember the tappable area can extend beyond the visible glyph via padding. [[46]](#sources) [[47]](#sources) [[48]](#sources) [[49]](#sources) [[50]](#sources) [[51]](#sources) [[64]](#sources)
11. **Make interactive elements look interactive and avoid false affordances** — Give clickable elements clear signifiers (shape, contrast, depth, underline, hover, cursor, and explicit labels on icons) so users never have to guess, and keep interactive and static styling mutually exclusive so plain text is never mistaken for a link nor vice versa. Apply the same treatment consistently so recognition is immediate. [[33]](#sources) [[61]](#sources) [[64]](#sources)
12. **Design a complete, differentiated set of interaction states** — Provide distinct enabled, hover, focus, pressed, and disabled states for every control, modeling them as reusable state-layer/overlay tokens so the same cue means the same thing everywhere. Give pressed feedback within ~100ms, keep hover distinct from focus, and mute disabled styling while keeping labels legible. [[32]](#sources) [[36]](#sources) [[39]](#sources)
13. **Provide a visible, high-contrast focus indicator and a logical focus order** — Use a focus ring at least a 2px-thick perimeter with 3:1 contrast, offset outside the element, driven by :focus-visible, and never suppress the default outline without an equivalent replacement. Match DOM/source order to visual reading order so keyboard traversal preserves meaning. [[32]](#sources) [[34]](#sources) [[52]](#sources) [[53]](#sources)
14. **Prefer clear error surfacing over silently disabled controls** — Reserve disabling for narrow cases (in-progress submission, genuinely unavailable items) and always explain why and how to re-enable; often it's better to keep the action enabled and validate on interaction. Disable rather than hide when users should know a feature exists, and hide only when it is permanently irrelevant. [[35]](#sources) [[37]](#sources) [[38]](#sources)
15. **Write clear, well-placed error and validation feedback** — Validate inline as fields complete, place messages adjacent to the offending field, and use plain, specific, blame-free language that states what went wrong and how to fix it. Preserve the user's input, reserve blocking dialogs for critical errors, and never signal errors by color alone. [[59]](#sources) [[62]](#sources) [[65]](#sources)
16. **Match feedback to actual response-time thresholds** — Under 0.1s feels instant (just show the result); under ~1s keeps flow unbroken; 2–10s needs a lightweight busy indicator; beyond ~10s show a percent-done progress indicator with an estimate. Let the delay bucket, not the operation type, dictate the cue, and keep system status visible for every action. [[36]](#sources) [[59]](#sources)
17. **Treat dark mode as a first-class, tone-based appearance** — Support both modes as a user-selectable option that respects the OS setting; drive it by swapping semantic-token values, not rewriting components. Use dark-gray (not pure black) surfaces and off-white (not pure white) text to reduce halation, convey elevation by lightening surfaces rather than shadows, desaturate accents, and re-verify contrast in the dark theme. [[23]](#sources) [[40]](#sources) [[41]](#sources) [[42]](#sources) [[43]](#sources) [[44]](#sources)
18. **Make motion optional, safe, and preference-aware** — Honor prefers-reduced-motion by reducing (not removing) movement — swap large transforms and parallax for opacity/small-scale changes while keeping timing and affordances. Give a pause/stop/hide control for anything moving over 5 seconds, keep flashing under three per second, and default to safe animation primitives. [[57]](#sources) [[58]](#sources)
19. **Use native semantics, labels, and structure for assistive tech** — Prefer native semantic HTML/elements over reinvented widgets, give every interactive control an accessible name (via associated labels, not placeholders), and maintain a correct heading/landmark structure with reading order matching the visual order. Follow established ARIA/APG patterns and implement their keyboard behavior when native semantics fall short. [[54]](#sources) [[55]](#sources) [[56]](#sources)
20. **Reduce and structure choices to lower cognitive load** — Follow familiar platform conventions (Jakob's Law), cut and progressively disclose options (Hick's Law), chunk content into small groups (~5–9 items), and highlight the recommended path. Apply aesthetic, minimalist design — every extra element competes with the relevant ones. [[59]](#sources) [[60]](#sources) [[66]](#sources)
21. **Invest in visual quality, but never let it mask usability failures** — Attractive interfaces are perceived as more usable and buy tolerance for minor friction, so polish is worthwhile — but aesthetics cannot cover large usability problems, and positive visual reactions can hide real task struggles in testing. Watch behavior alongside opinions and keep form supporting function. [[60]](#sources) [[63]](#sources)

## Sources

The 66 unique reliable sources consulted for this reference (deduplicated by URL). Numbers correspond to the bracketed citations above.

1. [Visual Hierarchy in UX: Definition](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) — Nielsen Norman Group
2. [5 Principles of Visual Design in UX](https://www.nngroup.com/articles/principles-visual-design/) — Nielsen Norman Group
3. [Building Better UI Designs With Layout Grids](https://www.smashingmagazine.com/2017/12/building-better-ui-designs-layout-grids/) — Smashing Magazine
4. [Typographic Hierarchies](https://www.smashingmagazine.com/2022/10/typographic-hierarchies/) — Smashing Magazine
5. [Law of Common Region](https://lawsofux.com/law-of-common-region/) — Laws of UX (Jon Yablonski)
6. [Law of Proximity](https://lawsofux.com/law-of-proximity/) — Laws of UX (Jon Yablonski)
7. [Layout — Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/foundations/layout) — Apple
8. [Understanding Success Criterion 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — W3C Web Accessibility Initiative (WAI)
9. [Color roles — Material Design 3](https://m3.material.io/styles/color/roles) — Google (Material Design 3)
10. [5 Visual Treatments that Improve Accessibility](https://www.nngroup.com/articles/visual-treatments-accessibility/) — Nielsen Norman Group
11. [Best Practices For Naming Design Tokens, Components And Variables](https://www.smashingmagazine.com/2024/05/naming-best-practices/) — Smashing Magazine
12. [The Easy Intro to the APCA Contrast Method](https://git.apcacontrast.com/documentation/APCAeasyIntro.html) — APCA / Myndex (WCAG 3 contrast research)
13. [Color — Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/color) — Apple
14. [Colour — GOV.UK Design System](https://design-system.service.gov.uk/styles/colour/) — GOV.UK / UK Government Digital Service
15. [Legibility, Readability, and Comprehension: Making Users Read Your Words](https://www.nngroup.com/articles/legibility-readability-comprehension/) — Nielsen Norman Group
16. [Readability: The Optimal Line Length](https://baymard.com/blog/line-length-readability) — Baymard Institute
17. [Typography — Type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens) — Google Material Design 3
18. [Typography — Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/foundations/typography/) — Apple
19. [Summary of key rules](https://practicaltypography.com/summary-of-key-rules.html) — Butterick's Practical Typography (Matthew Butterick)
20. [Understanding Success Criterion 1.4.12: Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) — W3C Web Accessibility Initiative (WAI)
21. [Line spacing](https://practicaltypography.com/line-spacing.html) — Butterick's Practical Typography (Matthew Butterick)
22. [Design tokens – Overview](https://m3.material.io/foundations/design-tokens/overview) — Material Design 3 (Google)
23. [Theming](https://ui.shadcn.com/docs/theming) — shadcn/ui
24. [Design Systems 101](https://www.nngroup.com/articles/design-systems-101/) — Nielsen Norman Group
25. [Design Tokens Format Module (2025.10)](https://www.designtokens.org/tr/drafts/format/) — W3C Design Tokens Community Group
26. [Design Token Naming Best Practices](https://www.netguru.com/blog/design-token-naming-best-practices) — Netguru
27. [Grids & spacing — Understanding layout](https://m3.material.io/foundations/layout/understanding-layout/spacing) — Material Design 3 (Google)
28. [Spacing — Elements](https://carbondesignsystem.com/elements/spacing/overview/) — IBM Carbon Design System
29. [2x Grid — Overview](https://carbondesignsystem.com/elements/2x-grid/overview/) — IBM Carbon Design System
30. [Layout — Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/layout) — Apple
31. [Basics: Spacing systems & scales in UI design](https://blog.designary.com/p/spacing-systems-and-scales-ui-design) — Designary (Christian Vasile)
32. [Button States: Communicate Interaction](https://www.nngroup.com/articles/button-states-communicate-interaction/) — Nielsen Norman Group
33. [Beyond Blue Links: Making Clickable Elements Recognizable](https://www.nngroup.com/articles/clickable-elements/) — Nielsen Norman Group
34. [A Guide to Designing Accessible, WCAG-Conformant Focus Indicators](https://www.sarasoueidan.com/blog/focus-indicators/) — Sara Soueidan
35. [Usability Pitfalls of Disabled Buttons, and How To Avoid Them](https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/) — Smashing Magazine
36. [Response Time Limits: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/) — Nielsen Norman Group
37. [Understanding Success Criterion 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) — W3C Web Accessibility Initiative (WAI)
38. [Hidden vs. Disabled In UX](https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/) — Smashing Magazine
39. [States (Material Design 3)](https://m3.material.io/foundations/interaction/states) — Google Material Design
40. [Dark Mode vs. Light Mode: Which Is Better?](https://www.nngroup.com/articles/dark-mode/) — Nielsen Norman Group
41. [Dark Mode - Foundations, Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/dark-mode) — Apple
42. [Building a Material Dark Theme on Android](https://m3.material.io/blog/android-dark-theme-tutorial) — Google Material Design
43. [Inclusive Dark Mode: Designing Accessible Dark Themes For All Users](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) — Smashing Magazine
44. [Elevation - Foundations](https://atlassian.design/foundations/elevation) — Atlassian Design System
45. [Understanding Success Criterion 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — W3C Web Accessibility Initiative (WAI)
46. [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/) — Nielsen Norman Group
47. [UI Design Dos and Don'ts](https://developer.apple.com/design/tips/) — Apple Developer (Human Interface Guidelines)
48. [Touch target size](https://support.google.com/accessibility/android/answer/7101858?hl=en) — Google / Android Accessibility Help
49. [Accessible Target Sizes Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) — Smashing Magazine
50. [How to Use Tappability Affordances](https://www.interaction-design.org/literature/article/how-to-use-tappability-affordances) — Interaction Design Foundation (IxDF)
51. [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — W3C Web Accessibility Initiative (WAI)
52. [Understanding SC 2.4.3: Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) — W3C Web Accessibility Initiative (WAI)
53. [Understanding SC 2.4.13: Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) — W3C Web Accessibility Initiative (WAI)
54. [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) — W3C Web Accessibility Initiative (WAI)
55. [Designing for Screen Reader Compatibility](https://webaim.org/techniques/screenreader/) — WebAIM (Center for Persons with Disabilities, Utah State University)
56. [Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/) — W3C Web Accessibility Initiative (WAI)
57. [Animation and Motion](https://web.dev/learn/accessibility/motion) — web.dev (Google) — Learn Accessibility course
58. [Designing With Reduced Motion For Motion Sensitivities](https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/) — Smashing Magazine (Val Head)
59. [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/) — Nielsen Norman Group
60. [Laws of UX](https://lawsofux.com/) — Laws of UX (Jon Yablonski)
61. [What are Affordances? (and Signifiers)](https://www.interaction-design.org/literature/topics/affordances) — Interaction Design Foundation (IxDF)
62. [Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/) — Nielsen Norman Group
63. [The Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) — Nielsen Norman Group
64. [Fitts's Law](https://lawsofux.com/fittss-law/) — Laws of UX (Jon Yablonski)
65. [10 Design Guidelines for Reporting Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/) — Nielsen Norman Group
66. [Hick's Law](https://lawsofux.com/hicks-law/) — Laws of UX (Jon Yablonski)
