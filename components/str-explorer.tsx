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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<
    "overview" | "wards" | "listing"
  >("overview");
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
    setIsSearchOpen(false);
    setIsSidebarOpen(true);
    setActiveMobilePanel("listing");

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
      setWardStatsStatus("loading");
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
    <main
      className="relative flex min-h-dvh overflow-hidden bg-[#11110f] pb-10 text-[#f4f1e8]"
      id="main-content"
    >
      <div
        aria-hidden="true"
        className="app-noise pointer-events-none fixed inset-0 z-40 opacity-[0.045]"
      />

      <section
        aria-label="Toronto short-term rental map"
        className="relative flex min-h-[calc(100dvh-2.5rem)] flex-1 overflow-hidden"
      >
        <TorontoMap
          onListingSelect={handleListingSelect}
          onViewportChange={handleViewportChange}
          propertyType={propertyType}
          q={searchQuery}
        />

        <div className="absolute left-3 right-3 top-3 z-10 flex flex-col gap-2 lg:left-5 lg:right-5 lg:top-5">
          <div className="flex items-start justify-between gap-2 lg:hidden">
            <button
              aria-controls="search-filters"
              aria-expanded={isSearchOpen}
              aria-label={
                isSearchOpen
                  ? "Close search and filters"
                  : "Open search and filters"
              }
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#191916]/92 text-[#f4f1e8] shadow-[0_10px_30px_rgb(16_15_11/30%)] backdrop-blur-xl transition duration-200 hover:border-white/20 hover:bg-[#24231f] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e39a88]"
              onClick={() => {
                setIsSearchOpen((isOpen) => {
                  if (!isOpen) {
                    setIsSidebarOpen(false);
                  }

                  return !isOpen;
                });
              }}
              type="button"
            >
              {isSearchOpen ? (
                <CloseIcon />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c87867] px-1 font-mono text-[8px] font-bold tabular-nums text-[#17150f]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <FreshnessBadge
              meta={meta}
              status={metaStatus}
              visibleListingCount={wardStats?.total ?? 0}
            />
          </div>

          <div
            className={`${isSearchOpen ? "flex" : "hidden"} flex-col gap-3 rounded-[14px] border border-white/10 bg-[#191916]/96 p-3 shadow-[0_18px_50px_rgb(16_15_11/35%)] backdrop-blur-xl md:flex-row md:items-end lg:flex lg:max-w-[820px] lg:bg-[#191916]/92`}
            id="search-filters"
          >
            <div className="hidden min-w-[180px] self-center pr-3 md:block">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[#c87867]">
                Toronto open data
              </p>
              <p className="mt-1.5 text-sm font-semibold tracking-[-0.025em] text-[#f4f1e8]">
                STR registrations
              </p>
            </div>

            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#8d897e]">
                Find a registration
              </span>
              <div className="relative">
                <SearchIcon />
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#24231f] pl-10 pr-3 text-sm font-medium tracking-[-0.01em] text-[#f4f1e8] outline-none transition duration-200 placeholder:text-[#777368] hover:border-white/20 focus:border-[#c87867] focus:ring-2 focus:ring-[#c87867]/20"
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setWardStatsStatus("loading");
                  }}
                  placeholder="Address, postal code, or registration ID"
                  type="search"
                  value={searchValue}
                />
              </div>
            </label>

            <label className="flex min-w-0 flex-col gap-1 md:w-52">
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#8d897e]">
                Property type
              </span>
              <select
                className="h-11 rounded-lg border border-white/10 bg-[#24231f] px-3 text-sm font-medium tracking-[-0.01em] text-[#f4f1e8] outline-none transition duration-200 hover:border-white/20 focus:border-[#c87867] focus:ring-2 focus:ring-[#c87867]/20"
                onChange={(event) => {
                  setPropertyType(event.target.value);
                  setWardStatsStatus("loading");
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
              className="h-11 rounded-lg border border-white/10 bg-transparent px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d0ccc1] transition duration-200 hover:border-white/20 hover:bg-white/5 active:translate-y-px disabled:cursor-not-allowed disabled:border-transparent disabled:text-[#625f57] disabled:hover:bg-transparent md:self-end"
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>

          <div className="hidden lg:block lg:max-w-[820px]">
            <FreshnessBadge
              meta={meta}
              status={metaStatus}
              visibleListingCount={wardStats?.total ?? 0}
            />
          </div>
        </div>
      </section>

      <aside
        aria-label="Registration details"
        className={`absolute bottom-10 left-0 right-0 z-20 flex flex-col overflow-hidden rounded-t-[26px] border-t border-white/12 bg-[#181815]/97 shadow-[0_-24px_70px_rgb(16_15_11/52%)] backdrop-blur-2xl transition-[max-height] duration-300 ease-out lg:static lg:z-auto lg:max-h-none lg:min-h-[calc(100dvh-2.5rem)] lg:w-[380px] lg:shrink-0 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:bg-[#171714] lg:shadow-[-20px_0_60px_rgb(16_15_11/18%)] lg:backdrop-blur-none ${
          isSidebarOpen ? "max-h-[72dvh]" : "max-h-[112px]"
        }`}
      >
        <button
          aria-controls="mobile-sidebar-content"
          aria-expanded={isSidebarOpen}
          className="group flex w-full items-center gap-4 px-5 pb-4 pt-2 text-left transition-colors active:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#e39a88] lg:hidden"
          onClick={() => {
            setIsSidebarOpen((isOpen) => {
              if (!isOpen) {
                setIsSearchOpen(false);
              }

              return !isOpen;
            });
          }}
          type="button"
        >
          <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/20 transition-colors group-hover:bg-white/30" />
          <span className="min-w-0 flex-1 pt-3">
            <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#c87867]">
              Visible map area
            </span>
            <span className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums tracking-[-0.055em] text-[#f4f1e8]">
                {formatNumber(wardStats?.total ?? 0)}
              </span>
              <span className="text-sm font-medium text-[#aaa69a]">
                registrations
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 pt-3 text-xs font-semibold text-[#d4d0c5]">
            {isSidebarOpen ? "Close" : "Explore"}
            <ChevronIcon expanded={isSidebarOpen} />
          </span>
        </button>

        <header className="hidden items-start justify-between gap-4 border-b border-white/8 px-6 pb-5 pt-6 lg:flex">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c87867]">
              Visible map area
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.045em] text-[#f4f1e8] lg:text-2xl">
              Registration snapshot
            </h1>
          </div>
          <span className="mt-0.5 rounded-md bg-[#282720] px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#aaa69a]">
            Live view
          </span>
        </header>

        <div
          className={`${isSidebarOpen ? "flex" : "hidden"} min-h-0 flex-1 flex-col border-t border-white/8 lg:flex lg:border-t-0`}
          id="mobile-sidebar-content"
        >
          <nav
            aria-label="Registration detail sections"
            className="grid grid-cols-3 gap-1 border-b border-white/8 bg-[#141411]/65 p-1.5 lg:hidden"
          >
            <MobilePanelTab
              active={activeMobilePanel === "overview"}
              label="Overview"
              onClick={() => setActiveMobilePanel("overview")}
            />
            <MobilePanelTab
              active={activeMobilePanel === "wards"}
              label="Wards"
              onClick={() => setActiveMobilePanel("wards")}
            />
            <MobilePanelTab
              active={activeMobilePanel === "listing"}
              hasActivity={selectedListingID !== null}
              label="Selected"
              onClick={() => setActiveMobilePanel("listing")}
            />
          </nav>

          <div className="data-scrollbar min-h-0 flex-1 overflow-y-auto">
            <section
              className={`${activeMobilePanel === "overview" ? "block" : "hidden"} px-5 pb-7 pt-5 lg:block lg:border-b lg:border-white/8 lg:px-6 lg:py-5`}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#aaa69a]">
                    Registrations in view
                  </p>
                  <p className="mt-2 text-5xl font-semibold tabular-nums tracking-[-0.065em] text-[#f4f1e8] lg:text-4xl">
                    {formatNumber(wardStats?.total ?? 0)}
                  </p>
                </div>
                <span className="mb-1 flex items-center gap-2 rounded-lg bg-[#282720] px-2.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bdb9ae]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      wardStatsStatus === "loading"
                        ? "animate-pulse bg-[#e39a88]"
                        : "bg-[#c87867]"
                    }`}
                  />
                  {wardStatsStatus === "loading" ? "Updating" : "Live view"}
                </span>
              </div>

              <div className="mt-5 rounded-xl bg-[#211f1a] px-4 py-3.5">
                <p className="text-sm leading-6 text-[#b8b4a9]">
                  {meta
                    ? `${formatNumber(meta.totalListings)} registrations are available citywide. Move or zoom the map to update this view.`
                    : activeFilterCount
                      ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"} applied to this map view.`
                      : "Move the map to update visible results."}
                </p>
              </div>
            </section>

            <section
              className={`${activeMobilePanel === "wards" ? "block" : "hidden"} px-5 pb-7 pt-5 lg:block lg:border-b lg:border-white/8 lg:px-6 lg:py-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#c87867] lg:hidden">
                    Current map bounds
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#f4f1e8] lg:mt-0 lg:text-sm lg:text-[#e9e5da]">
                    Busiest wards in view
                  </h2>
                </div>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#858176]">
                  {wardStatsStatus === "loading"
                    ? "Updating"
                    : `${formatNumber(wardStats?.total ?? 0)} total`}
                </span>
              </div>
              <WardStatsList stats={wardStats} status={wardStatsStatus} />
            </section>

            <section
              className={`${activeMobilePanel === "listing" ? "flex" : "hidden"} min-h-0 flex-1 flex-col px-5 pb-7 pt-5 lg:flex lg:px-6 lg:py-5`}
            >
              <ListingSelection
                listing={selectedListing}
                selectedListingID={selectedListingID}
                status={selectionStatus}
              />
            </section>
          </div>
        </div>
      </aside>
    </main>
  );
}

function MobilePanelTab({
  active,
  hasActivity = false,
  label,
  onClick,
}: {
  active: boolean;
  hasActivity?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={`relative h-10 rounded-lg text-xs font-semibold transition duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#e39a88] ${
        active
          ? "bg-[#2a2822] text-[#f4f1e8] shadow-[inset_0_1px_rgb(255_255_255/5%)]"
          : "text-[#8f8b80] hover:bg-white/[0.03] hover:text-[#d0ccc1]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      {hasActivity ? (
        <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-[#c87867]" />
      ) : null}
    </button>
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
    <div className="flex w-fit max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-white/8 bg-[#191916]/86 px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#c6c2b7] shadow-[0_10px_30px_rgb(16_15_11/25%)] backdrop-blur-xl">
      <span
        className={`h-1.5 w-1.5 rounded-full shadow-[0_0_0_3px_currentColor] ${
          status === "error"
            ? "bg-[#cf735c] text-[#cf735c]/15"
            : "bg-[#c87867] text-[#c87867]/15"
        }`}
      />
      <span>{label}</span>
      <span className="text-[#7f7b71]">
        {formatNumber(visibleListingCount)} in view
      </span>
      {meta ? (
        <span className="hidden text-[#7f7b71] sm:inline">
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
      <div aria-live="polite">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#858176]">
          Selected registration
        </p>
        <div className="mt-3 animate-pulse rounded-xl bg-[#22211d] p-4">
          <div className="h-3 w-24 rounded bg-[#3a382f]" />
          <div className="mt-4 h-5 w-4/5 rounded bg-[#3a382f]" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-lg bg-[#2e2c26]" />
            <div className="h-12 rounded-lg bg-[#2e2c26]" />
          </div>
          <span className="sr-only">Loading {selectedListingID}</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#858176]">
          Selected registration
        </p>
        <p className="mt-3 rounded-xl border border-[#6d4036] bg-[#2b1d19] px-4 py-3 text-sm leading-6 text-[#e9ab9b]">
          Listing details could not be loaded.
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#858176]">
          Selected registration
        </p>
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#211f1a] p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#c87867]/12 text-[#c87867]">
            <MapPinIcon />
          </div>
          <p className="text-sm leading-6 text-[#aaa69a]">
            Select a cyan point on the map to inspect its registration details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#858176]">
        Selected registration
      </p>
      <h3 className="mt-3 text-lg font-semibold tracking-[-0.035em] text-[#f4f1e8]">
        {listing.address}
      </h3>
      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
        <Detail label="Postal code" value={listing.postalCode} />
        <Detail label="Property type" value={listing.propertyType ?? "None"} />
        <Detail
          label="Ward"
          value={[listing.wardNumber, listing.wardName]
            .filter(Boolean)
            .join(" - ")}
        />
        <Detail
          label="Source updated"
          value={formatDate(listing.sourceUpdatedAt)}
        />
        <Detail label="Ingested" value={formatDate(listing.ingestedAt)} />
      </dl>

      <div className="mt-5 border-t border-white/8 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold tracking-[-0.015em] text-[#e9e5da]">
            Registration IDs
          </h4>
          <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#858176]">
            {formatNumber(listing.registrationIds.length)} total
          </span>
        </div>

        <div className="data-scrollbar mt-3 max-h-56 overflow-y-auto rounded-lg bg-[#11110f]">
          {listing.registrationIds.map((registrationID) => (
            <div
              className="border-b border-white/8 px-3 py-2.5 font-mono text-[11px] text-[#c6c2b7] last:border-b-0"
              key={registrationID}
            >
              {registrationID}
            </div>
          ))}
        </div>
      </div>
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
      <div className="mt-3 rounded-lg border border-[#6d4036] bg-[#2b1d19] px-3 py-2 text-sm leading-6 text-[#e9ab9b]">
        Ward counts could not be loaded.
      </div>
    );
  }

  if (status === "loading" && !stats) {
    return (
      <div className="mt-4 space-y-3" aria-label="Loading ward counts">
        {[72, 56, 44, 31].map((width) => (
          <div className="flex animate-pulse items-center gap-3" key={width}>
            <div
              className="h-2.5 rounded bg-[#37352d]"
              style={{ width: `${width}%` }}
            />
            <div className="ml-auto h-3 w-6 rounded bg-[#37352d]" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats?.wards.length) {
    return (
      <div className="mt-3 rounded-lg bg-[#211f1a] px-3 py-3 text-sm leading-6 text-[#9b978b]">
        No ward counts for the current view.
      </div>
    );
  }

  const maximumCount = Math.max(...stats.wards.map((ward) => ward.count), 1);

  return (
    <div
      className={`mt-4 space-y-3 transition-opacity ${
        status === "loading" ? "opacity-45" : ""
      }`}
    >
      {stats.wards.slice(0, 8).map((wardCount) => (
        <div
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
          key={`${wardCount.wardNumber ?? "unknown"}-${wardCount.wardName ?? "ward"}`}
        >
          <span className="truncate text-sm font-medium tracking-[-0.01em] text-[#bdb9ae] lg:text-xs">
            {[wardCount.wardNumber, wardCount.wardName]
              .filter(Boolean)
              .join(" - ") || "Unknown ward"}
          </span>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-[#d5d1c6] lg:text-[10px]">
            {formatNumber(wardCount.count)}
          </span>
          <div className="col-span-2 h-1 overflow-hidden rounded-full bg-[#2c2a24]">
            <div
              className="h-full rounded-full bg-[#c87867]"
              style={{
                width: `${Math.max((wardCount.count / maximumCount) * 100, 3)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777368]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm leading-5 text-[#c6c2b7] lg:text-xs">
        {value || "None"}
      </dd>
    </div>
  );
}

function SearchIcon({
  className = "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d897e]",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6.5 6.5 11 11m0-11-11 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 transition-transform duration-300 ${
        expanded ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m7 9.5 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M19 10c0 4.8-7 11-7 11S5 14.8 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
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
