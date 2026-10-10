import {queryOptions} from "@tanstack/react-query";

import {searchMapPlaces, type SearchMapPlacesParams,} from "@/lib/api/map";

export const mapSearchQueryOptions=(params: SearchMapPlacesParams) =>
    queryOptions({
        queryKey: ["map", "places", "search", params.query, params.page ?? 1, params.size ?? 15],
        queryFn: ({signal}) => searchMapPlaces(params, signal),
        enabled: params.query.trim().length > 0,
        staleTime: 5 * 60_000,
    })

