"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TorontoMap } from "@/components/toronto-map";
import {
  fetchListing,
  fetchMeta,
  fetchWardStats,
  type ApiMeta,
  type Bounds,
  type ListingDetail,
  type WardStats,
} from "@/lib/api";

export function STRExplorer() {
  const [searchValue, setSearchValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [metaStatus, setMetaStatus] = useState<"idle" | "error">("idle");
  const [viewportBounds, setViewportBounds] = useState<Bounds | null>(null);
  const [wardStats, setWardStats] = useState<WardStats | null>(null);
  const [wardStatsStatus, setWardStatsStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [selectedListingID, setSelectedListingID] = useState<string | null>(
    null,
  );
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(
    null,
  );
  const [selectionStatus, setSelectionStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const handleListingSelect = useCallback((id: string) => {
    setSelectedListingID(id);
    setSelectedListing(null);
    setSelectionStatus("loading");

    fetchListing(id)
      .then((listing) => {
        setSelectedListing(listing);
        setSelectionStatus("idle");
      })
      .catch(() => {
        setSelectionStatus("error");
      });
  }, []);

  const handleViewportChange = useCallback(
    ({ bounds }: { bounds: Bounds; zoom: number }) => {
      setViewportBounds(bounds);
    },
    [],
  );

  const activeFilterCount = useMemo(() => {
    return [searchQuery.trim(), propertyType.trim()].filter(Boolean).length;
  }, [propertyType, searchQuery]);

  const propertyTypeOptions = useMemo(() => {
    return meta?.propertyTypes ?? [];
  }, [meta?.propertyTypes]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchValue.trim());
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchValue]);

  useEffect(() => {
    const abortController = new AbortController();

    fetchMeta({ signal: abortController.signal })
      .then((nextMeta) => {
        setMeta(nextMeta);
        setMetaStatus("idle");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMeta(null);
        setMetaStatus("error");
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!viewportBounds) {
      return;
    }

    const abortController = new AbortController();

    fetchWardStats(
      {
        bbox: viewportBounds,
        propertyType,
        q: searchQuery,
      },
      { signal: abortController.signal },
    )
      .then((nextWardStats) => {
        setWardStats(nextWardStats);
        setWardStatsStatus("idle");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setWardStats(null);
        setWardStatsStatus("error");
      });

    return () => {
      abortController.abort();
    };
  }, [propertyType, searchQuery, viewportBounds]);

  const clearFilters = () => {
    setSearchValue("");
    setSearchQuery("");
    setPropertyType("");
  };

  return (
    <main className="flex min-h-dvh bg-[#eef2f3] text-[#172026]">
      <section className="relative flex min-h-dvh flex-1 overflow-hidden">
        <TorontoMap
          onListingSelect={handleListingSelect}
          onViewportChange={handleViewportChange}
          propertyType={propertyType}
          q={searchQuery}
        />

        <div className="absolute left-4 right-4 top-4 z-10 flex flex-col gap-3 lg:left-6 lg:right-[390px]">
          <div className="flex flex-col gap-3 rounded-md border border-[#c7d1d3] bg-white/95 p-3 shadow-sm backdrop-blur md:flex-row">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-normal text-[#526368]">
                Search
              </span>
              <input
                className="h-10 rounded-md border border-[#b9c5c8] bg-white px-3 text-sm outline-none transition focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                onChange={(event) => {
                  setSearchValue(event.target.value);
                }}
                placeholder="Address, postal code, or registration ID"
                type="search"
                value={searchValue}
              />
            </label>

            <label className="flex min-w-0 flex-col gap-1 md:w-64">
              <span className="text-xs font-semibold uppercase tracking-normal text-[#526368]">
                Property type
              </span>
              <select
                className="h-10 rounded-md border border-[#b9c5c8] bg-white px-3 text-sm outline-none transition focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                onChange={(event) => {
                  setPropertyType(event.target.value);
                }}
                value={propertyType}
              >
                <option value="">All property types</option>
                {propertyTypeOptions.map((propertyTypeOption) => (
                  <option key={propertyTypeOption} value={propertyTypeOption}>
                    {propertyTypeOption}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="h-10 rounded-md border border-[#b9c5c8] bg-[#172026] px-4 text-sm font-semibold text-white transition hover:bg-[#2d3b40] disabled:cursor-not-allowed disabled:border-[#d6dedf] disabled:bg-[#e6ecee] disabled:text-[#7b898d] md:self-end"
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>

          <FreshnessBadge
            meta={meta}
            status={metaStatus}
            visibleListingCount={wardStats?.total ?? 0}
          />
        </div>

        <div className="absolute bottom-4 left-4 z-10 rounded-md border border-[#c7d1d3] bg-white/95 px-3 py-2 text-xs font-medium text-[#526368] shadow-sm">
          Toronto short-term rental registrations
        </div>
      </section>

      <aside className="hidden w-[360px] shrink-0 border-l border-[#c7d1d3] bg-[#fbfcfc] lg:flex lg:min-h-dvh lg:flex-col">
        <header className="border-b border-[#d6dedf] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#637277]">
            Visible area
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#172026]">
            Toronto STR Explorer
          </h1>
        </header>

        <section className="border-b border-[#d6dedf] px-5 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-[#637277]">
                Listings
              </p>
              <p className="mt-1 text-3xl font-semibold text-[#172026]">
                {formatNumber(wardStats?.total ?? 0)}
              </p>
            </div>
            <p className="text-right text-sm text-[#637277]">
              {meta
                ? `${formatNumber(meta.totalListings)} registered citywide`
                : activeFilterCount
                  ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
                  : "Move the map to update visible results."}
            </p>
          </div>
        </section>

        <section className="border-b border-[#d6dedf] px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#172026]">Ward counts</h2>
            <span className="text-xs font-medium text-[#637277]">
              {wardStatsStatus === "loading"
                ? "Updating"
                : `${formatNumber(wardStats?.total ?? 0)} total`}
            </span>
          </div>
          <WardStatsList stats={wardStats} status={wardStatsStatus} />
        </section>

        <section className="flex min-h-0 flex-1 flex-col px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#172026]">Listings</h2>
            <span className="text-xs font-medium text-[#637277]">0 shown</span>
          </div>

          <div className="mt-3 flex min-h-28 items-center justify-center rounded-md border border-dashed border-[#b9c5c8] bg-white px-4 text-center text-sm text-[#637277]">
            No listings in view
          </div>

          <ListingSelection
            listing={selectedListing}
            selectedListingID={selectedListingID}
            status={selectionStatus}
          />
        </section>
      </aside>
    </main>
  );
}

function FreshnessBadge({
  meta,
  status,
  visibleListingCount,
}: {
  meta: ApiMeta | null;
  status: "idle" | "error";
  visibleListingCount: number;
}) {
  const label =
    status === "error"
      ? "Freshness unavailable"
      : `Updated ${formatRelativeDate(meta?.lastSuccessfulIngestionAt ?? null)}`;

  return (
    <div className="flex w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-[#b8c9ca] bg-white/90 px-3 py-2 text-sm shadow-sm backdrop-blur">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === "error" ? "bg-[#d96c4a]" : "bg-[#1f9d75]"
        }`}
      />
      <span className="font-medium">{label}</span>
      <span className="text-[#647277]">
        {formatNumber(visibleListingCount)} in view
      </span>
      {meta ? (
        <span className="text-[#647277]">
          {formatNumber(meta.totalListings)} total
        </span>
      ) : null}
    </div>
  );
}

function ListingSelection({
  listing,
  selectedListingID,
  status,
}: {
  listing: ListingDetail | null;
  selectedListingID: string | null;
  status: "idle" | "loading" | "error";
}) {
  if (status === "loading") {
    return (
      <div className="mt-4 rounded-md border border-[#d6dedf] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-[#637277]">
          Selection
        </p>
        <p className="mt-2 text-sm text-[#2d3b40]">
          Loading {selectedListingID}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-4 rounded-md border border-[#d6dedf] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-[#637277]">
          Selection
        </p>
        <p className="mt-2 text-sm text-[#9b2c2c]">
          Listing details could not be loaded.
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mt-4 rounded-md border border-[#d6dedf] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-[#637277]">
          Selection
        </p>
        <p className="mt-2 text-sm text-[#2d3b40]">
          Select a point on the map to view registration details.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-[#d6dedf] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-[#637277]">
        Selection
      </p>
      <h3 className="mt-2 text-base font-semibold text-[#172026]">
        {listing.address}
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-3 text-sm">
        <Detail label="Registration" value={listing.id} />
        <Detail label="Postal code" value={listing.postalCode} />
        <Detail label="Property type" value={listing.propertyType ?? "None"} />
        <Detail
          label="Ward"
          value={[listing.wardNumber, listing.wardName]
            .filter(Boolean)
            .join(" - ")}
        />
        <Detail label="Source updated" value={formatDate(listing.sourceUpdatedAt)} />
        <Detail label="Ingested" value={formatDate(listing.ingestedAt)} />
      </dl>
    </div>
  );
}

function WardStatsList({
  stats,
  status,
}: {
  stats: WardStats | null;
  status: "idle" | "loading" | "error";
}) {
  if (status === "error") {
    return (
      <div className="mt-3 rounded-md border border-[#d6dedf] bg-white px-3 py-2 text-sm text-[#9b2c2c]">
        Ward counts could not be loaded.
      </div>
    );
  }

  if (!stats?.wards.length) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-[#b9c5c8] bg-white px-3 py-3 text-sm text-[#637277]">
        No ward counts for the current view.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {stats.wards.slice(0, 8).map((wardCount) => (
        <div
          className="flex items-center justify-between rounded-md border border-[#d6dedf] bg-white px-3 py-2"
          key={`${wardCount.wardNumber ?? "unknown"}-${wardCount.wardName ?? "ward"}`}
        >
          <span className="truncate text-sm text-[#2d3b40]">
            {[wardCount.wardNumber, wardCount.wardName]
              .filter(Boolean)
              .join(" - ") || "Unknown ward"}
          </span>
          <span className="ml-3 text-sm font-semibold text-[#1f7a6b]">
            {formatNumber(wardCount.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-normal text-[#637277]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[#2d3b40]">{value || "None"}</dd>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "None";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRelativeDate(value: string | null): string {
  if (!value) {
    return "pending";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA").format(value);
}
