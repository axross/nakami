import { useQuery } from "@tanstack/react-query";
import { useAuthSession } from "~/auth/stores/auth-store";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import {
	type Collection,
	toCollectionList,
} from "~/collections/models/collection";

/**
 * Loads the signed-in server's readable, non-system collections. Keyed by
 * server + user so switching account or server refetches instead of showing
 * another session's collections; disabled (and never fetched) when signed out.
 */
export function useCollections() {
	const session = useAuthSession();

	return useQuery<Collection[]>({
		queryKey: [
			"collections",
			session?.serverUrl ?? null,
			session?.user.id ?? null,
		],
		enabled: session !== null,
		queryFn: async () => {
			if (session === null) {
				return [];
			}

			const access = await fetchAccess(session.serverUrl, session.token);
			return toCollectionList(access);
		},
	});
}
