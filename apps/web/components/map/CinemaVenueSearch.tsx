"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {VenueSearchFormValues, venueSearchSchema} from "@/schemas/cinema-venue-search.schema";
import {zodResolver} from "@hookform/resolvers/zod";
import {useQuery} from "@tanstack/react-query";
import {mapSearchQueryOptions} from "@/lib/queries/map-search.query";
import {useSaveVenue} from "@/lib/queries/map-venue.mutation";
import {MapPlace, Venue} from "@/lib/api/map";

type VenueSearchProps = {
    onSelected: (venueId: string) => void;
};

export function VenueSearch({
    onSelected,
}: VenueSearchProps) {
    const [submittedQuery, setSubmittedQuery] = useState("");
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: {errors},
    } = useForm<VenueSearchFormValues>({
        resolver: zodResolver(venueSearchSchema),
        defaultValues: {
            query: '',
        }
    });

    const searchQuery = useQuery(
        mapSearchQueryOptions({
            query: submittedQuery,
        }),
    );

    const saveVenueMutation = useSaveVenue();

    const onSubmit=(values:VenueSearchFormValues)=>{
        setSubmittedQuery((values.query))
    }

    const handleSelect = (place: MapPlace) => {
        setValue('query',place.place_name,{
            shouldDirty:true,
            shouldValidate:true
        })
        saveVenueMutation.mutate(place, {
            onSuccess: (venue) => {
                setSelectedVenue(venue);
                setSubmittedQuery('');
                onSelected(venue.id);
            },
        });
    };

    const handleChangeVenue=()=>{
        setSelectedVenue(null);
        setValue('query','');
        setSubmittedQuery('');
        saveVenueMutation.reset()
    }


    return (
        <section className="space-y-4">
            {selectedVenue ? (
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 p-3">
                    <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                            {selectedVenue.brandName
                                ? `${selectedVenue.brandName} · ${selectedVenue.name}`
                                : selectedVenue.name}
                        </p>
                        {selectedVenue.roadAddress && (
                            <p className="mt-1 truncate text-sm text-white/60">
                                {selectedVenue.roadAddress}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleChangeVenue}
                        className="ml-3 shrink-0 text-sm text-cinemo-gold hover:text-cinemo-gold/80"
                    >
                        장소 변경
                    </button>
                </div>
            ) : (
                <>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
                        <input
                            {...register("query")}
                            placeholder="관람 장소 검색"
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white"
                        />

                        <button
                            type="submit"
                            className="rounded-lg bg-cinemo-gold px-4 py-3 text-black"
                        >
                            검색
                        </button>
                    </form>

                    {errors.query && (
                        <p className="text-sm text-red-400">
                            {errors.query.message}
                        </p>
                    )}

                    {searchQuery.isLoading && (
                        <p className="text-sm text-white/60">검색 중...</p>
                    )}

                    <div className="max-h-58 space-y-2 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {searchQuery.data?.documents.map((place) => (
                            <button
                                key={place.id}
                                type="button"
                                onClick={() => handleSelect(place)}
                                className="block h-18 w-full shrink-0 rounded-lg border border-white/10 px-4 py-3 text-left hover:border-cinemo-gold"
                            >
                                <p className="font-medium text-white">
                                    {place.place_name}
                                </p>
                                <p className="mt-1 text-sm text-white/60">
                                    {place.road_address_name || place.address_name}
                                </p>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
