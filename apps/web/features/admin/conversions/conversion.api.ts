import { apiClient } from "@/lib/api/apiClient";

import type { ConversionRow } from "./conversion.types";

export async function getConversionRows(signal?: AbortSignal): Promise<ConversionRow[]> {
  const { data } = await apiClient.get<ConversionRow[]>("/admin/conversions", { signal });
  return data;
}
