import {useMutation, useQueryClient} from "@tanstack/react-query";

import {type MapPlace, saveVenue} from "@/lib/api/map";

export function useSaveVenue(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:(place:MapPlace)=>saveVenue(place),
        
    })
}
