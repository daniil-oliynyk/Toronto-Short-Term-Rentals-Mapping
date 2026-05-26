export type ApiMeta = {
  totalListings: number;
  propertyTypes: string[];
  lastSuccessfulIngestionAt: string | null;
};

export type ListingDetail = {
  id: string;
  address: string;
  postalCode: string;
  propertyType: string | null;
  wardNumber: string | null;
  wardName: string | null;
  latitude: number;
  longitude: number;
  sourceUpdatedAt: string | null;
  ingestedAt: string;
  ingestionRunId: string;
};

export type GeoJSONPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type MapFeatureProperties = {
  cluster: boolean;
  count?: number;
  id?: string;
  address?: string;
  postalCode?: string;
  propertyType?: string | null;
  wardNumber?: string | null;
  wardName?: string | null;
  sourceUpdatedAt?: string | null;
  ingestedAt?: string;
};

export type MapFeature = {
  type: "Feature";
  id?: string;
  geometry: GeoJSONPoint;
  properties: MapFeatureProperties;
};

export type MapFeatureCollection = {
  type: "FeatureCollection";
  features: MapFeature[];
};

export type WardCount = {
  wardNumber: string | null;
  wardName: string | null;
  count: number;
};

export type WardStats = {
  total: number;
  wards: WardCount[];
};

export type Bounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type MapListingsParams = {
  bbox: Bounds;
  zoom: number;
  q?: string;
  propertyType?: string;
};

export type WardStatsParams = {
  bbox: Bounds;
  q?: string;
  propertyType?: string;
};

const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function getAPIBaseURL(): string {
  if (!apiBaseURL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  return apiBaseURL.replace(/\/+$/, "");
}

export async function fetchMeta(init?: RequestInit): Promise<ApiMeta> {
  return fetchJSON<ApiMeta>("/api/meta", init);
}

export async function fetchListing(
  id: string,
  init?: RequestInit,
): Promise<ListingDetail> {
  return fetchJSON<ListingDetail>(
    `/api/listings/${encodeURIComponent(id)}`,
    init,
  );
}

export async function fetchMapListings(
  params: MapListingsParams,
  init?: RequestInit,
): Promise<MapFeatureCollection> {
  return fetchJSON<MapFeatureCollection>(
    `/api/listings/map?${mapListingsSearchParams(params)}`,
    init,
  );
}

export async function fetchWardStats(
  params: WardStatsParams,
  init?: RequestInit,
): Promise<WardStats> {
  return fetchJSON<WardStats>(
    `/api/stats/wards?${wardStatsSearchParams(params)}`,
    init,
  );
}

export function mapListingsSearchParams(
  params: MapListingsParams,
): URLSearchParams {
  const searchParams = baseMapSearchParams(params);
  searchParams.set("zoom", String(Math.round(params.zoom)));

  return searchParams;
}

export function wardStatsSearchParams(params: WardStatsParams): URLSearchParams {
  return baseMapSearchParams(params);
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(`${getAPIBaseURL()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function baseMapSearchParams(params: WardStatsParams): URLSearchParams {
  const searchParams = new URLSearchParams({
    bbox: bboxParam(params.bbox),
  });

  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.propertyType?.trim()) {
    searchParams.set("property_type", params.propertyType.trim());
  }

  return searchParams;
}

function bboxParam(bounds: Bounds): string {
  return [bounds.west, bounds.south, bounds.east, bounds.north].join(",");
}
