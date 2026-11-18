import { Injectable } from "@nestjs/common";
import { TheaterExclusive } from "@prisma/client";

import {
  CinemaShowtime,
  PoliteCinemaShowtimeClient,
} from "@/integrations/cinema-showtime/polite-cinema-showtime.client";
import { GetCinemaShowtimesRequestDto } from "../dto/requests/get-cinema-showtimes.request.dto";
import {
  CinemaShowtimeItemResponseDto,
  CinemaShowtimesResponseDto,
} from "../dto/responses/cinema-showtimes.response.dto";
import {
  calculateDistanceKm,
  getKoreaDate,
  toCompactDate,
} from "../mappers/cinema-showtimes.mapper";
import { CinemaShowtimesRepository } from "../repositories/cinema-showtimes.repository";

const MAX_NEARBY_CINEMAS_PER_CHAIN = 2;

type LinkedCinema = Awaited<
  ReturnType<CinemaShowtimesRepository["findLinkedCinemas"]>
>[number] & {
  distanceKm: number;
};

@Injectable()
export class CinemaShowtimesService {
  constructor(
    private readonly repository: CinemaShowtimesRepository,
    private readonly client: PoliteCinemaShowtimeClient,
  ) {}

  async getNearbyShowtimes(
    query: GetCinemaShowtimesRequestDto,
  ): Promise<CinemaShowtimesResponseDto> {
    const date = query.date ?? getKoreaDate();
    const linkedCinemas = await this.repository.findLinkedCinemas();
    const nearbyCinemas = this.selectNearbyCinemas(linkedCinemas, query);
    const results = await Promise.allSettled(
      nearbyCinemas.map((cinema) => this.getCinemaShowtimes(cinema, query.movieTitle, date)),
    );

    const unavailableChains = new Set<string>();
    const items = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;

      unavailableChains.add(this.getChainLabel(nearbyCinemas[index].chain));
      return [];
    });

    return {
      movieTitle: query.movieTitle,
      date,
      items: items.sort(
        (first, second) =>
          new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime() ||
          first.distanceKm - second.distanceKm,
      ),
      unavailableChains: [...unavailableChains],
    };
  }

  private selectNearbyCinemas(
    cinemas: Awaited<ReturnType<CinemaShowtimesRepository["findLinkedCinemas"]>>,
    location: Pick<GetCinemaShowtimesRequestDto, "latitude" | "longitude">,
  ): LinkedCinema[] {
    const byChain = new Map<TheaterExclusive, LinkedCinema[]>();

    for (const cinema of cinemas) {
      const latitude = Number(cinema.venue.latitude);
      const longitude = Number(cinema.venue.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      const candidate: LinkedCinema = {
        ...cinema,
        distanceKm: calculateDistanceKm({
          fromLatitude: location.latitude,
          fromLongitude: location.longitude,
          toLatitude: latitude,
          toLongitude: longitude,
        }),
      };
      byChain.set(cinema.chain, [...(byChain.get(cinema.chain) ?? []), candidate]);
    }

    return [...byChain.values()].flatMap((chainCinemas) =>
      chainCinemas
        .sort((first, second) => first.distanceKm - second.distanceKm)
        .slice(0, MAX_NEARBY_CINEMAS_PER_CHAIN),
    );
  }

  private async getCinemaShowtimes(
    cinema: LinkedCinema,
    movieTitle: string,
    date: string,
  ): Promise<CinemaShowtimeItemResponseDto[]> {
    const input = {
      theaterCode: cinema.externalCode,
      movieTitle,
      date: toCompactDate(date),
    };
    const showtimes = await this.getShowtimesByChain(cinema.chain, input);

    return showtimes.map((showtime) => this.toResponse(showtime, cinema));
  }

  private getShowtimesByChain(
    chain: TheaterExclusive,
    input: { theaterCode: string; movieTitle: string; date: string },
  ) {
    switch (chain) {
      case TheaterExclusive.CGV:
        return this.client.getCgvShowtimes(input);
      case TheaterExclusive.LOTTE_CINEMA:
        return this.client.getLotteCinemaShowtimes(input);
      case TheaterExclusive.MEGABOX:
        return this.client.getMegaboxShowtimes(input);
    }
  }

  private toResponse(
    showtime: CinemaShowtime,
    cinema: LinkedCinema,
  ): CinemaShowtimeItemResponseDto {
    return {
      ...showtime,
      theaterName: cinema.officialName ?? showtime.theaterName ?? cinema.venue.name,
      address: cinema.venue.roadAddress ?? cinema.venue.jibunAddress,
      distanceKm: Number(cinema.distanceKm.toFixed(1)),
      bookingUrl: cinema.bookingUrl ?? showtime.bookingUrl,
    };
  }

  private getChainLabel(chain: TheaterExclusive) {
    return {
      [TheaterExclusive.CGV]: "CGV",
      [TheaterExclusive.LOTTE_CINEMA]: "롯데시네마",
      [TheaterExclusive.MEGABOX]: "메가박스",
    }[chain];
  }
}
