"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsBoolean } from "nuqs";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Filter } from "lucide-react";
import { DataTable } from "./components/data-table";
import { FilterPanel } from "./components/filter-panel";
import { ActiveFilterBadges } from "./components/active-filter-badges";
import { SortControls } from "./components/sort-controls";
import { SegmentManager } from "./components/segment-manager";
import { getSegments, saveSegment, deleteSegment } from "./actions";
import type {
  ProductRow,
  ProductFilters,
  ProductSegment,
  SortField,
} from "./components/types";

// Parse filters from URL
const filterParsers = {
  search: parseAsString.withDefault(""),
  brands: parseAsArrayOf(parseAsString).withDefault([]),
  productTypes: parseAsArrayOf(parseAsString).withDefault([]),
  productClasses: parseAsArrayOf(parseAsString).withDefault([]),
  formFactors: parseAsArrayOf(parseAsString).withDefault([]),
  hearingLossLevels: parseAsArrayOf(parseAsString).withDefault([]),
  rechargeable: parseAsBoolean,
  telecoil: parseAsBoolean,
  bluetooth: parseAsBoolean,
  hands_free: parseAsBoolean,
  tap_controls: parseAsBoolean,
  voice_assistant: parseAsBoolean,
  disposable_batteries: parseAsBoolean,
  push_button: parseAsBoolean,
  volume_rocker: parseAsBoolean,
  accelerometer: parseAsBoolean,
  gyroscope: parseAsBoolean,
  priceMin: parseAsString,
  priceMax: parseAsString,
  scoreMin: parseAsString,
  scoreMax: parseAsString,
  sortPrimary: parseAsString.withDefault("score"),
  sortPrimaryDesc: parseAsBoolean.withDefault(true),
  sortSecondary: parseAsString,
  sortSecondaryDesc: parseAsBoolean.withDefault(true),
};

export default function ProductsPage() {
  const [urlState, setUrlState] = useQueryStates(filterParsers, {
    history: "push",
  });

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    brands: [] as string[],
    productTypes: [] as string[],
    formFactors: [] as string[],
    hearingLossLevels: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Convert URL state to ProductFilters
  const filters: ProductFilters = useMemo(
    () => ({
      search: urlState.search,
      brands: urlState.brands,
      productTypes: urlState.productTypes,
      productClasses: urlState.productClasses as ("OTC" | "Rx")[],
      formFactors: urlState.formFactors,
      hearingLossLevels: urlState.hearingLossLevels,
      features: {
        ...(urlState.rechargeable !== null && { rechargeable: urlState.rechargeable }),
        ...(urlState.telecoil !== null && { telecoil: urlState.telecoil }),
        ...(urlState.bluetooth !== null && { bluetooth: urlState.bluetooth }),
        ...(urlState.hands_free !== null && { hands_free: urlState.hands_free }),
        ...(urlState.tap_controls !== null && { tap_controls: urlState.tap_controls }),
        ...(urlState.voice_assistant !== null && { voice_assistant: urlState.voice_assistant }),
        ...(urlState.disposable_batteries !== null && { disposable_batteries: urlState.disposable_batteries }),
        ...(urlState.push_button !== null && { push_button: urlState.push_button }),
        ...(urlState.volume_rocker !== null && { volume_rocker: urlState.volume_rocker }),
        ...(urlState.accelerometer !== null && { accelerometer: urlState.accelerometer }),
        ...(urlState.gyroscope !== null && { gyroscope: urlState.gyroscope }),
      },
      priceMin: urlState.priceMin ? Number(urlState.priceMin) : null,
      priceMax: urlState.priceMax ? Number(urlState.priceMax) : null,
      scoreMin: urlState.scoreMin ? Number(urlState.scoreMin) : null,
      scoreMax: urlState.scoreMax ? Number(urlState.scoreMax) : null,
    }),
    [urlState]
  );

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const supabase = createClient();

      // Fetch brands (non-discontinued only, via releases)
      const { data: brandsData } = await supabase
        .from("brands")
        .select("name")
        .eq("hidden", false)
        .order("name");

      // Fetch product types from models
      const { data: productTypesData } = await supabase
        .from("models")
        .select("product_type")
        .eq("discontinued", false);

      // Fetch form factors (styles)
      const { data: stylesData } = await supabase
        .from("styles")
        .select("name")
        .order("name");

      // Common hearing loss levels
      const hearingLossLevels = ["Mild", "Moderate", "Severe", "Profound"];

      setFilterOptions({
        brands: brandsData?.map((b) => b.name) || [],
        productTypes: [
          ...new Set(productTypesData?.map((p) => p.product_type) || []),
        ],
        formFactors: stylesData?.map((s) => s.name) || [],
        hearingLossLevels,
      });
    };

    fetchFilterOptions();
  }, []);

  // Fetch segments on mount
  useEffect(() => {
    const fetchSegments = async () => {
      const data = await getSegments();
      setSegments(data);
    };
    fetchSegments();
  }, []);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const supabase = createClient();

      // Complex query with joins
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          slug,
          name,
          full_name,
          score,
          sound_score,
          model:models!inner (
            id,
            name,
            full_name,
            tags,
            product_type,
            discontinued,
            hearing_loss_level,
            style:styles (
              name,
              category
            ),
            release:releases!inner (
              brand:brands (
                name
              ),
              product_class,
              discontinued
            ),
            model_features (
              value,
              brand_hardware_feature:brand_hardware_features (
                hardware_feature:hardware_features (
                  slug
                )
              )
            )
          ),
          level:levels (
            id
          ),
          offers (
            price
          )
        `)
        .eq("model.discontinued", false)
        .eq("model.release.discontinued", false);

      if (error) {
        console.error("Error fetching products:", error);
        setIsLoading(false);
        return;
      }

      // Get all product IDs to fetch HT ratings and evaluations
      const productIds = (data || []).map((p) => p.id);

      // Fetch HT ratings for all products (join on airtable_id, not product_id)
      const { data: htRatingsData } = productIds.length > 0
        ? await supabase
            .from("ht_ratings")
            .select(`
              airtable_id,
              ht_score,
              sound_score,
              sound_score_comment,
              build_quality,
              build_quality_comment,
              battery,
              battery_comment,
              bluetooth,
              bluetooth_comment,
              app_features,
              app_features_comment,
              comfort,
              comfort_comment,
              design,
              design_comment,
              pro_support,
              pro_support_comment,
              handling,
              handling_comment,
              value,
              value_comment
            `)
            .in("airtable_id", productIds)
        : { data: [] };

      // Fetch evaluations for all products
      const { data: evaluationsData } = productIds.length > 0
        ? await supabase
            .from("evaluations")
            .select("product_id, fit_type, speech_in_quiet, speech_in_noise, music_streaming, feedback_handling, own_voice")
            .in("product_id", productIds)
        : { data: [] };

      // Create maps for quick lookup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const htRatingsMap = new Map<number, any>();
      (htRatingsData || []).forEach((r) => {
        htRatingsMap.set(r.airtable_id, r);
      });

      type EvalRow = {
        product_id: number;
        fit_type: string | null;
        speech_in_quiet: number | null;
        speech_in_noise: number | null;
        music_streaming: number | null;
        feedback_handling: number | null;
        own_voice: number | null;
      };
      const evaluationsMap = new Map<number, { initial: EvalRow | null; tuned: EvalRow | null }>();
      (evaluationsData || []).forEach((e) => {
        const existing = evaluationsMap.get(e.product_id) || { initial: null, tuned: null };
        if (e.fit_type?.toLowerCase() === "initial") {
          existing.initial = e;
        } else if (e.fit_type?.toLowerCase() === "tuned") {
          existing.tuned = e;
        }
        evaluationsMap.set(e.product_id, existing);
      });

      // Transform data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedProducts: ProductRow[] = (data || []).map((p: any) => {
        const model = p.model;

        // Extract hardware features from model_features array
        const featureMap: Record<string, boolean | string> = {};
        if (model?.model_features) {
          model.model_features.forEach((mf: { value: unknown; brand_hardware_feature: { hardware_feature: { slug: string } | null } | null }) => {
            const slug = mf.brand_hardware_feature?.hardware_feature?.slug;
            if (slug && mf.value !== null) {
              if (slug === "ip-rating-liquid" || slug === "ip-rating-solid") {
                featureMap[slug] = String(mf.value);
              } else {
                featureMap[slug] = Boolean(mf.value);
              }
            }
          });
        }

        // Get lowest price from offers
        const prices = (p.offers || [])
          .map((o: { price: number }) => o.price)
          .filter((price: number) => price > 0);
        const lowestPrice = prices.length ? Math.min(...prices) : null;

        // Handle nested relations (Supabase returns single objects for !inner joins)
        const release = model?.release;
        const brand = release?.brand;
        const style = model?.style;

        // Get HT rating data
        const htRating = htRatingsMap.get(p.id);
        const evals = evaluationsMap.get(p.id);

        return {
          id: p.id,
          name: p.name,
          full_name: p.full_name,
          slug: p.slug,
          brand_name: brand?.name || "Unknown",
          model_name: model?.name || "",
          form_factor: style?.name || "",
          form_factor_category: style?.category || "",
          product_type: model?.product_type || "",
          product_class: release?.product_class === "OTC" ? "OTC" : release?.product_class === "rX" ? "Rx" : null,
          hearing_loss_levels: model?.hearing_loss_level || [],
          score: p.score,
          sound_score: p.sound_score ? Number(p.sound_score) : null,
          price: lowestPrice,
          features: {
            rechargeable: featureMap["rechargeable-batteries"] === true,
            telecoil: featureMap["telecoil"] === true,
            bluetooth: featureMap["bluetoothtm-audio"] === true,
            hands_free: featureMap["hands-free-calling"] === true,
            tap_controls: featureMap["tap-controls"] === true,
            voice_assistant: featureMap["voice-assistant"] === true,
            disposable_batteries: featureMap["disposable-batteries"] === true,
            ip_rating_liquid: typeof featureMap["ip-rating-liquid"] === "string" ? featureMap["ip-rating-liquid"] : null,
            ip_rating_solid: typeof featureMap["ip-rating-solid"] === "string" ? featureMap["ip-rating-solid"] : null,
            push_button: featureMap["push-button"] === true,
            volume_rocker: featureMap["volume-rocker"] === true,
            accelerometer: featureMap["accelerometer"] === true,
            gyroscope: featureMap["gyroscope"] === true,
          },
          ht_rating: htRating ? {
            ht_score: htRating.ht_score ? Number(htRating.ht_score) : null,
            sound_score: htRating.sound_score ? Number(htRating.sound_score) : null,
            sound_score_comment: htRating.sound_score_comment,
            build_quality: htRating.build_quality ? Number(htRating.build_quality) : null,
            build_quality_comment: htRating.build_quality_comment,
            battery: htRating.battery ? Number(htRating.battery) : null,
            battery_comment: htRating.battery_comment,
            bluetooth: htRating.bluetooth ? Number(htRating.bluetooth) : null,
            bluetooth_comment: htRating.bluetooth_comment,
            app_features: htRating.app_features ? Number(htRating.app_features) : null,
            app_features_comment: htRating.app_features_comment,
            comfort: htRating.comfort ? Number(htRating.comfort) : null,
            comfort_comment: htRating.comfort_comment,
            design: htRating.design ? Number(htRating.design) : null,
            design_comment: htRating.design_comment,
            pro_support: htRating.pro_support ? Number(htRating.pro_support) : null,
            pro_support_comment: htRating.pro_support_comment,
            handling: htRating.handling ? Number(htRating.handling) : null,
            handling_comment: htRating.handling_comment,
            value: htRating.value ? Number(htRating.value) : null,
            value_comment: htRating.value_comment,
          } : null,
          initial: evals?.initial ? {
            speech_in_quiet: evals.initial.speech_in_quiet ? Number(evals.initial.speech_in_quiet) : null,
            speech_in_noise: evals.initial.speech_in_noise ? Number(evals.initial.speech_in_noise) : null,
            music_streaming: evals.initial.music_streaming ? Number(evals.initial.music_streaming) : null,
            feedback_handling: evals.initial.feedback_handling ? Number(evals.initial.feedback_handling) : null,
            own_voice: evals.initial.own_voice ? Number(evals.initial.own_voice) : null,
          } : null,
          tuned: evals?.tuned ? {
            speech_in_quiet: evals.tuned.speech_in_quiet ? Number(evals.tuned.speech_in_quiet) : null,
            speech_in_noise: evals.tuned.speech_in_noise ? Number(evals.tuned.speech_in_noise) : null,
            music_streaming: evals.tuned.music_streaming ? Number(evals.tuned.music_streaming) : null,
            feedback_handling: evals.tuned.feedback_handling ? Number(evals.tuned.feedback_handling) : null,
            own_voice: evals.tuned.own_voice ? Number(evals.tuned.own_voice) : null,
          } : null,
        };
      });

      setProducts(transformedProducts);
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  // Filter products client-side
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(searchLower) ||
          p.brand_name.toLowerCase().includes(searchLower) ||
          p.model_name.toLowerCase().includes(searchLower)
      );
    }

    // Brand filter
    if (filters.brands.length > 0) {
      result = result.filter((p) => filters.brands.includes(p.brand_name));
    }

    // Product type filter
    if (filters.productTypes.length > 0) {
      result = result.filter((p) =>
        filters.productTypes.includes(p.product_type)
      );
    }

    // Product class filter
    if (filters.productClasses.length > 0) {
      result = result.filter(
        (p) => p.product_class && filters.productClasses.includes(p.product_class)
      );
    }

    // Form factor filter
    if (filters.formFactors.length > 0) {
      result = result.filter((p) => filters.formFactors.includes(p.form_factor));
    }

    // Hearing loss level filter
    if (filters.hearingLossLevels.length > 0) {
      result = result.filter((p) =>
        p.hearing_loss_levels.some((level) =>
          filters.hearingLossLevels.includes(level)
        )
      );
    }

    // Hardware feature filters
    const featureFilters = filters.features;
    if (featureFilters.rechargeable === true) {
      result = result.filter((p) => p.features.rechargeable);
    }
    if (featureFilters.telecoil === true) {
      result = result.filter((p) => p.features.telecoil);
    }
    if (featureFilters.bluetooth === true) {
      result = result.filter((p) => p.features.bluetooth);
    }
    if (featureFilters.hands_free === true) {
      result = result.filter((p) => p.features.hands_free);
    }
    if (featureFilters.tap_controls === true) {
      result = result.filter((p) => p.features.tap_controls);
    }
    if (featureFilters.voice_assistant === true) {
      result = result.filter((p) => p.features.voice_assistant);
    }
    if (featureFilters.disposable_batteries === true) {
      result = result.filter((p) => p.features.disposable_batteries);
    }
    if (featureFilters.push_button === true) {
      result = result.filter((p) => p.features.push_button);
    }
    if (featureFilters.volume_rocker === true) {
      result = result.filter((p) => p.features.volume_rocker);
    }
    if (featureFilters.accelerometer === true) {
      result = result.filter((p) => p.features.accelerometer);
    }
    if (featureFilters.gyroscope === true) {
      result = result.filter((p) => p.features.gyroscope);
    }

    // Price range filter
    if (filters.priceMin !== null) {
      result = result.filter(
        (p) => p.price !== null && p.price >= filters.priceMin!
      );
    }
    if (filters.priceMax !== null) {
      result = result.filter(
        (p) => p.price !== null && p.price <= filters.priceMax!
      );
    }

    // HT Score range filter
    if (filters.scoreMin !== null) {
      result = result.filter(
        (p) => p.ht_rating?.ht_score !== null && p.ht_rating?.ht_score !== undefined && p.ht_rating.ht_score >= filters.scoreMin!
      );
    }
    if (filters.scoreMax !== null) {
      result = result.filter(
        (p) => p.ht_rating?.ht_score !== null && p.ht_rating?.ht_score !== undefined && p.ht_rating.ht_score <= filters.scoreMax!
      );
    }

    // Sort
    const sortPrimary = urlState.sortPrimary as SortField | null;
    const sortPrimaryDesc = urlState.sortPrimaryDesc;
    const sortSecondary = urlState.sortSecondary as SortField | null;
    const sortSecondaryDesc = urlState.sortSecondaryDesc;

    result = [...result].sort((a, b) => {
      // Primary sort
      if (sortPrimary) {
        const cmp = compareByField(a, b, sortPrimary, sortPrimaryDesc);
        if (cmp !== 0) return cmp;
      }
      // Secondary sort
      if (sortSecondary) {
        return compareByField(a, b, sortSecondary, sortSecondaryDesc);
      }
      return 0;
    });

    return result;
  }, [products, filters, urlState.sortPrimary, urlState.sortPrimaryDesc, urlState.sortSecondary, urlState.sortSecondaryDesc]);

  const handleFiltersChange = useCallback(
    (newFilters: ProductFilters) => {
      startTransition(() => {
        setUrlState({
          search: newFilters.search,
          brands: newFilters.brands,
          productTypes: newFilters.productTypes,
          productClasses: newFilters.productClasses,
          formFactors: newFilters.formFactors,
          hearingLossLevels: newFilters.hearingLossLevels,
          rechargeable: newFilters.features.rechargeable ?? null,
          telecoil: newFilters.features.telecoil ?? null,
          bluetooth: newFilters.features.bluetooth ?? null,
          hands_free: newFilters.features.hands_free ?? null,
          tap_controls: newFilters.features.tap_controls ?? null,
          voice_assistant: newFilters.features.voice_assistant ?? null,
          disposable_batteries: newFilters.features.disposable_batteries ?? null,
          push_button: newFilters.features.push_button ?? null,
          volume_rocker: newFilters.features.volume_rocker ?? null,
          accelerometer: newFilters.features.accelerometer ?? null,
          gyroscope: newFilters.features.gyroscope ?? null,
          priceMin: newFilters.priceMin?.toString() ?? null,
          priceMax: newFilters.priceMax?.toString() ?? null,
          scoreMin: newFilters.scoreMin?.toString() ?? null,
          scoreMax: newFilters.scoreMax?.toString() ?? null,
        });
      });
    },
    [setUrlState]
  );

  const handleSortChange = useCallback(
    (
      primary: SortField | null,
      primaryDesc: boolean,
      secondary: SortField | null,
      secondaryDesc: boolean
    ) => {
      startTransition(() => {
        setUrlState({
          sortPrimary: primary,
          sortPrimaryDesc: primaryDesc,
          sortSecondary: secondary,
          sortSecondaryDesc: secondaryDesc,
        });
      });
    },
    [setUrlState]
  );

  const handleSaveSegment = useCallback(
    async (name: string) => {
      await saveSegment(
        name,
        filters,
        urlState.sortPrimary as SortField | null,
        urlState.sortPrimaryDesc,
        urlState.sortSecondary as SortField | null,
        urlState.sortSecondaryDesc
      );
      const updatedSegments = await getSegments();
      setSegments(updatedSegments);
    },
    [filters, urlState]
  );

  const handleLoadSegment = useCallback(
    (segment: ProductSegment) => {
      const f = segment.filters;
      setUrlState({
        search: f.search,
        brands: f.brands,
        productTypes: f.productTypes,
        productClasses: f.productClasses,
        formFactors: f.formFactors,
        hearingLossLevels: f.hearingLossLevels,
        rechargeable: f.features.rechargeable ?? null,
        telecoil: f.features.telecoil ?? null,
        bluetooth: f.features.bluetooth ?? null,
        hands_free: f.features.hands_free ?? null,
        tap_controls: f.features.tap_controls ?? null,
        voice_assistant: f.features.voice_assistant ?? null,
        disposable_batteries: f.features.disposable_batteries ?? null,
        push_button: f.features.push_button ?? null,
        volume_rocker: f.features.volume_rocker ?? null,
        accelerometer: f.features.accelerometer ?? null,
        gyroscope: f.features.gyroscope ?? null,
        priceMin: f.priceMin?.toString() ?? null,
        priceMax: f.priceMax?.toString() ?? null,
        scoreMin: f.scoreMin?.toString() ?? null,
        scoreMax: f.scoreMax?.toString() ?? null,
        sortPrimary: segment.sort_primary,
        sortPrimaryDesc: segment.sort_primary_desc,
        sortSecondary: segment.sort_secondary,
        sortSecondaryDesc: segment.sort_secondary_desc,
      });
    },
    [setUrlState]
  );

  const handleDeleteSegment = useCallback(async (segmentId: string) => {
    await deleteSegment(segmentId);
    const updatedSegments = await getSegments();
    setSegments(updatedSegments);
  }, []);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.brands.length;
    count += filters.productTypes.length;
    count += filters.productClasses.length;
    count += filters.formFactors.length;
    count += filters.hearingLossLevels.length;
    count += Object.keys(filters.features).length;
    if (filters.priceMin !== null) count++;
    if (filters.priceMax !== null) count++;
    if (filters.scoreMin !== null) count++;
    if (filters.scoreMax !== null) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground">
            Browse and filter hearing aid products
          </p>
        </div>
        <SegmentManager
          segments={segments}
          currentFilters={filters}
          sortPrimary={urlState.sortPrimary as SortField | null}
          sortPrimaryDesc={urlState.sortPrimaryDesc}
          sortSecondary={urlState.sortSecondary as SortField | null}
          sortSecondaryDesc={urlState.sortSecondaryDesc}
          onSaveSegment={handleSaveSegment}
          onLoadSegment={handleLoadSegment}
          onDeleteSegment={handleDeleteSegment}
        />
      </div>

      {/* Collapsible Filter Panel */}
      <Collapsible
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        className="group/collapsible rounded-lg border bg-card"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-4">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filter Badges */}
      <ActiveFilterBadges
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Sort Controls & Count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SortControls
          sortPrimary={urlState.sortPrimary as SortField | null}
          sortPrimaryDesc={urlState.sortPrimaryDesc}
          sortSecondary={urlState.sortSecondary as SortField | null}
          sortSecondaryDesc={urlState.sortSecondaryDesc}
          onSortChange={handleSortChange}
        />
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            `${filteredProducts.length} products`
          )}
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <DataTable data={filteredProducts} />
      )}
    </div>
  );
}

function compareByField(
  a: ProductRow,
  b: ProductRow,
  field: SortField,
  desc: boolean
): number {
  let aVal: string | number | null;
  let bVal: string | number | null;

  switch (field) {
    case "ht_score":
      aVal = a.ht_rating?.ht_score ?? null;
      bVal = b.ht_rating?.ht_score ?? null;
      break;
    case "price":
      aVal = a.price;
      bVal = b.price;
      break;
    case "brand_name":
      aVal = a.brand_name;
      bVal = b.brand_name;
      break;
    case "full_name":
      aVal = a.full_name;
      bVal = b.full_name;
      break;
    default:
      return 0;
  }

  // Handle nulls - push to end
  if (aVal === null && bVal === null) return 0;
  if (aVal === null) return 1;
  if (bVal === null) return -1;

  let cmp: number;
  if (typeof aVal === "string" && typeof bVal === "string") {
    cmp = aVal.localeCompare(bVal);
  } else {
    cmp = (aVal as number) - (bVal as number);
  }

  return desc ? -cmp : cmp;
}
