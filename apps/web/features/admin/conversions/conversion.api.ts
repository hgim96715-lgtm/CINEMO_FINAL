import { apiClient } from "@/lib/api/apiClient";

import { toConversionRows } from "./conversion.mapper";
import type { ConversionDayResponse, ConversionRow } from "./conversion.types";

export async function getConversionRows(signal?: AbortSignal): Promise<ConversionRow[]> {
  const { data } = await apiClient.get<ConversionDayResponse[]>("/admin/conversions", { signal });
  return toConversionRows(data);
}
