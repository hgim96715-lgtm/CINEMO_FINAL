import { apiClient } from "@/lib/api/apiClient";

export type CinemaVisitVerificationType =
  "MANUAL" | "LOCATION" | "RECEIPT" | "RESERVATION";

export type CinemaVisitVerificationStatus =
  "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type CreateCinemaVisitInput = {
  venueId: string;
  movieRecordId?: string | null;
  visitedAt?: string;
  verificationType?: CinemaVisitVerificationType;
  note?: string | null;
  idempotencyKey: string;
};

export type CinemaVisit = {
  id: string;
  venueId: string;
  movieRecordId: string | null;
  visitedAt: string;
  verificationType: CinemaVisitVerificationType;
  verificationStatus: CinemaVisitVerificationStatus;
  verifiedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  venue: {
    id: string;
    name: string;
    brand: string | null;
    address: string | null;
  } | null;
  movieRecord: {
    id: string;
    movieId: string;
  } | null;
};

export type CinemaVisitStamp = {
  venueId: string;
  visitCount: number;
  firstVisitedAt: string;
  lastVisitedAt: string;
};

export type CreateCinemaVisitResponse = {
  visit: CinemaVisit;
  stamp: CinemaVisitStamp;
};

export async function createCinemaVisit(
  input: CreateCinemaVisitInput,
): Promise<CreateCinemaVisitResponse> {
  const response = await apiClient.post<CreateCinemaVisitResponse>(
    "/cinema-passport/visits",
    input,
  );
  return response.data;
}

export async function getCinemaVists(
  signal?: AbortSignal,
): Promise<CinemaVisit[]> {
  const response = await apiClient.get<CinemaVisit[]>(
    "/cinema-passport/visits",
    { signal },
  );
  return response.data;
}

export async function getCinemaVisitsByVenue(
  venueId: string,
  signal?: AbortSignal,
): Promise<CinemaVisit[]> {
  const response = await apiClient.get<CinemaVisit[]>(
    `/cinema-passport/visits/venus/${encodeURIComponent(venueId)}`,
    { signal },
  );
  return response.data;
}

export async function deleteCinemaVisit(visitId: string): Promise<void> {
  await apiClient.delete(
    `/cinema-passport/visits/${encodeURIComponent(visitId)}`,
  );
}
