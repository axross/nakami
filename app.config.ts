import { execSync } from "node:child_process";
import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Resolves the full commit hash of the source this build is produced from,
 * evaluated at Expo config resolution (build) time. Preference order: EAS
 * Build's commit env var, GitHub Actions' commit env var, then a local `git`
 * call for on-machine `dev`/`run` builds.
 *
 * @returns the 40-character commit hash, or `undefined` when none resolves (the
 * app then shows "Unknown"). Never throws — a missing `git` is caught.
 */
function resolveCommitHash(): string | undefined {
	const fromEnv =
		process.env.EAS_BUILD_GIT_COMMIT_HASH ?? process.env.GITHUB_SHA;
	if (fromEnv !== undefined && fromEnv !== "") {
		return fromEnv;
	}

	try {
		return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
	} catch {
		return undefined;
	}
}

// Dynamic config extending the static app.json (received as `config`); only
// `extra.commitHash` is added here, so the generated native project is
// unchanged. name/slug are re-stated to satisfy the required ExpoConfig fields
// the context types as optional.
export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: config.name ?? "payload-mobile",
	slug: config.slug ?? "payload-mobile",
	extra: {
		...config.extra,
		commitHash: resolveCommitHash(),
	},
});
