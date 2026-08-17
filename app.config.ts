import { execSync } from "node:child_process";
import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * resolves the full commit hash of the source this build is produced from,
 * evaluated at Expo config resolution (build) time. prefers GitHub Actions'
 * `GITHUB_SHA` (the CI build), then a local `git` call for on-machine
 * `dev`/`run` builds.
 *
 * @returns the 40-character commit hash, or `undefined` when none resolves (the
 * app then shows "Unknown"). never throws — a missing `git` is caught.
 */
function resolveCommitHash(): string | undefined {
	// truthiness, not `??`, so an empty GITHUB_SHA falls through to git.
	if (process.env.GITHUB_SHA) {
		return process.env.GITHUB_SHA;
	}

	try {
		return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
	} catch {
		return undefined;
	}
}

// dynamic config extending the static app.json: Expo passes the static config
// in as `config` and uses this function's return value as the final config
// (https://docs.expo.dev/workflow/configuration/). name/slug are re-stated to
// satisfy the required ExpoConfig fields the context types as optional.
//
// `version` is overridden only when PREVIEW_VERSION_NAME is set — the Android
// preview build (android-build.yml) sets it to a per-build identifier like
// "1.0.0-pr-123" or "1.0.0-<short-sha>" so a tester can tell which PR/commit an
// installed APK came from. it becomes the APK's versionName, baked into the
// generated native project at `expo prebuild` time. AGP's assemble-time
// `android.injected.version.name` property leaves versionName unchanged on the
// AGP this project generates, so the value must be resolved here, at config
// time, instead. absent the env var (dev/run/local builds) `version` stays the
// app.json value. empty is treated as unset via `||`.
export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: config.name ?? "Nakami",
	slug: config.slug ?? "nakami",
	version: process.env.PREVIEW_VERSION_NAME || config.version,
	extra: {
		...config.extra,
		commitHash: resolveCommitHash(),
	},
});
