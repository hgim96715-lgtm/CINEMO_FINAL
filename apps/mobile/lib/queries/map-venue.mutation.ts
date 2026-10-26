import { useMutation } from "@tanstack/react-query";

import { saveVenue, type MapPlace } from "@/lib/api/map";

export function useSaveVenue() {
  return useMutation({
    mutationFn: (place: MapPlace) => saveVenue(place),
  });
}
