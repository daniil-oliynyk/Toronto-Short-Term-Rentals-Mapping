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
    <main className="flex min-h-dvh bg-[#0b0b0c] text-[#f1f1f2]">
      <section className="relative flex min-h-dvh flex-1 overflow-hidden">
        <TorontoMap
          onListingSelect={handleListingSelect}
          onViewportChange={handleViewportChange}
          propertyType={propertyType}
          q={searchQuery}
        />

        <div className="absolute left-4 right-4 top-4 z-10 flex flex-col gap-3 lg:left-6 lg:right-[390px]">
          <div className="flex flex-col gap-3 rounded-md border border-[#3a3a3d] bg-[#141414]/95 p-3 shadow-[0_12px_32px_rgb(0_0_0/32%)] backdrop-blur md:flex-row">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-normal text-[#b6b6ba]">
                Search
              </span>
              <input
                className="h-10 rounded-md border border-[#47474a] bg-[#1c1c1f] px-3 text-sm text-[#f1f1f2] outline-none transition placeholder:text-[#7b7b80] focus:border-[#8f8f95] focus:ring-2 focus:ring-[#8f8f95]/25"
                onChange={(event) => {
                  setSearchValue(event.target.value);
                }}
                placeholder="Address, postal code, or registration ID"
                type="search"
                value={searchValue}
              />
            </label>

            <label className="flex min-w-0 flex-col gap-1 md:w-64">
              <span className="text-xs font-semibold uppercase tracking-normal text-[#b6b6ba]">
                Property type
              </span>
              <select
                className="h-10 rounded-md border border-[#47474a] bg-[#1c1c1f] px-3 text-sm text-[#f1f1f2] outline-none transition focus:border-[#8f8f95] focus:ring-2 focus:ring-[#8f8f95]/25"
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
              className="h-10 rounded-md border border-[#525255] bg-[#242426] px-4 text-sm font-semibold text-[#f1f1f2] transition hover:bg-[#303034] disabled:cursor-not-allowed disabled:border-[#303033] disabled:bg-[#171719] disabled:text-[#6f6f74] md:self-end"
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

      </section>

      <aside className="hidden w-[360px] shrink-0 border-l border-[#2a2a2d] bg-[#101011] lg:flex lg:min-h-dvh lg:flex-col">
        <header className="border-b border-[#2e2e31] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#a9a9ad]">
            Visible area
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#f1f1f2]">
            Toronto STR Explorer
          </h1>
        </header>

        <section className="border-b border-[#2e2e31] px-5 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-[#a9a9ad]">
                Listings
              </p>
              <p className="mt-1 text-3xl font-semibold text-[#f1f1f2]">
                {formatNumber(wardStats?.total ?? 0)}
              </p>
            </div>
            <p className="text-right text-sm text-[#b6b6ba]">
              {meta
                ? `${formatNumber(meta.totalListings)} registered citywide`
                : activeFilterCount
                  ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
                  : "Move the map to update visible results."}
            </p>
          </div>
        </section>

        <section className="border-b border-[#2e2e31] px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#f1f1f2]">Ward counts</h2>
            <span className="text-xs font-medium text-[#a9a9ad]">
              {wardStatsStatus === "loading"
                ? "Updating"
                : `${formatNumber(wardStats?.total ?? 0)} total`}
            </span>
          </div>
          <WardStatsList stats={wardStats} status={wardStatsStatus} />
        </section>

        <section className="flex min-h-0 flex-1 flex-col px-5 py-4">
          {/* <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#f1f1f2]">Listings</h2>
            <span className="text-xs font-medium text-[#a9a9ad]">0 shown</span>
          </div>

          <div className="mt-3 flex min-h-28 items-center justify-center rounded-md border border-dashed border-[#444447] bg-[#18181a] px-4 text-center text-sm text-[#a9a9ad]">
            No listings in view
          </div> */}

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
    <div className="flex w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-[#3a3a3d] bg-[#141414]/90 px-3 py-2 text-sm text-[#f1f1f2] shadow-[0_8px_24px_rgb(0_0_0/28%)] backdrop-blur">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === "error" ? "bg-[#d96c4a]" : "bg-[#1f9d75]"
        }`}
      />
      <span className="font-medium">{label}</span>
      <span className="text-[#a9a9ad]">
        {formatNumber(visibleListingCount)} in view
      </span>
      {meta ? (
        <span className="text-[#a9a9ad]">
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
      <div className="mt-4 rounded-md border border-[#2e2e31] bg-[#18181a] p-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-[#a9a9ad]">
          Selection
        </p>
        <p className="mt-2 text-sm text-[#d4d4d6]">
          Loading {selectedListingID}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-4 rounded-md border border-[#3d2d2b] bg-[#211816] p-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-[#bda49f]">
          Selection
        </p>
        <p className="mt-2 text-sm text-[#ffb6a3]">
          Listing details could not be loaded.
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mt-4 rounded-md border border-[#2e2e31] bg-[#18181a] p-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-[#a9a9ad]">
          Selection
        </p>
        <p className="mt-2 text-sm text-[#d4d4d6]">
          Select a point on the map to view registration details.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-[#2e2e31] bg-[#18181a] p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-[#a9a9ad]">
        Selection
      </p>
      <h3 className="mt-2 text-base font-semibold text-[#f1f1f2]">
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
      <div className="mt-3 rounded-md border border-[#3d2d2b] bg-[#211816] px-3 py-2 text-sm text-[#ffb6a3]">
        Ward counts could not be loaded.
      </div>
    );
  }

  if (!stats?.wards.length) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-[#444447] bg-[#18181a] px-3 py-3 text-sm text-[#a9a9ad]">
        No ward counts for the current view.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {stats.wards.slice(0, 8).map((wardCount) => (
        <div
          className="flex items-center justify-between rounded-md border border-[#2e2e31] bg-[#18181a] px-3 py-2"
          key={`${wardCount.wardNumber ?? "unknown"}-${wardCount.wardName ?? "ward"}`}
        >
          <span className="truncate text-sm text-[#d4d4d6]">
            {[wardCount.wardNumber, wardCount.wardName]
              .filter(Boolean)
              .join(" - ") || "Unknown ward"}
          </span>
          <span className="ml-3 text-sm font-semibold text-[#c7c7cb]">
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
      <dt className="text-xs font-semibold uppercase tracking-normal text-[#a9a9ad]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[#d4d4d6]">{value || "None"}</dd>
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
