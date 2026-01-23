"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProductFilters, FEATURE_GROUPS, DEFAULT_FILTERS } from "./types";

interface ActiveFilterBadgesProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

// Create a flat lookup for feature labels
const FEATURE_LABELS: Record<string, string> = {};
Object.values(FEATURE_GROUPS).forEach((features) => {
  features.forEach((f) => {
    FEATURE_LABELS[f.key] = f.label;
  });
});

export function ActiveFilterBadges({
  filters,
  onFiltersChange,
}: ActiveFilterBadgesProps) {
  const removeSearch = () => {
    onFiltersChange({ ...filters, search: "" });
  };

  const removeBrand = (brand: string) => {
    onFiltersChange({
      ...filters,
      brands: filters.brands.filter((b) => b !== brand),
    });
  };

  const removeProductType = (type: string) => {
    onFiltersChange({
      ...filters,
      productTypes: filters.productTypes.filter((t) => t !== type),
    });
  };

  const removeProductClass = (cls: "OTC" | "Rx") => {
    onFiltersChange({
      ...filters,
      productClasses: filters.productClasses.filter((c) => c !== cls),
    });
  };

  const removeFormFactor = (ff: string) => {
    onFiltersChange({
      ...filters,
      formFactors: filters.formFactors.filter((f) => f !== ff),
    });
  };

  const removeHearingLossLevel = (level: string) => {
    onFiltersChange({
      ...filters,
      hearingLossLevels: filters.hearingLossLevels.filter((l) => l !== level),
    });
  };

  const removeFeature = (feature: string) => {
    const newFeatures = { ...filters.features };
    delete newFeatures[feature as keyof typeof newFeatures];
    onFiltersChange({ ...filters, features: newFeatures });
  };

  const removePriceMin = () => {
    onFiltersChange({ ...filters, priceMin: null });
  };

  const removePriceMax = () => {
    onFiltersChange({ ...filters, priceMax: null });
  };

  const removeScoreMin = () => {
    onFiltersChange({ ...filters, scoreMin: null });
  };

  const removeScoreMax = () => {
    onFiltersChange({ ...filters, scoreMax: null });
  };

  const clearAll = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  // Collect all active filters
  const badges: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.search) {
    badges.push({
      key: "search",
      label: `"${filters.search}"`,
      onRemove: removeSearch,
    });
  }

  filters.brands.forEach((brand) => {
    badges.push({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () => removeBrand(brand),
    });
  });

  filters.productTypes.forEach((type) => {
    badges.push({
      key: `type-${type}`,
      label: type,
      onRemove: () => removeProductType(type),
    });
  });

  filters.productClasses.forEach((cls) => {
    badges.push({
      key: `class-${cls}`,
      label: cls,
      onRemove: () => removeProductClass(cls),
    });
  });

  filters.formFactors.forEach((ff) => {
    badges.push({
      key: `ff-${ff}`,
      label: ff,
      onRemove: () => removeFormFactor(ff),
    });
  });

  filters.hearingLossLevels.forEach((level) => {
    badges.push({
      key: `hl-${level}`,
      label: level,
      onRemove: () => removeHearingLossLevel(level),
    });
  });

  Object.keys(filters.features).forEach((feature) => {
    badges.push({
      key: `feature-${feature}`,
      label: FEATURE_LABELS[feature] || feature,
      onRemove: () => removeFeature(feature),
    });
  });

  if (filters.priceMin !== null) {
    badges.push({
      key: "priceMin",
      label: `Price >= $${filters.priceMin}`,
      onRemove: removePriceMin,
    });
  }

  if (filters.priceMax !== null) {
    badges.push({
      key: "priceMax",
      label: `Price <= $${filters.priceMax}`,
      onRemove: removePriceMax,
    });
  }

  if (filters.scoreMin !== null) {
    badges.push({
      key: "scoreMin",
      label: `HT Score >= ${filters.scoreMin}`,
      onRemove: removeScoreMin,
    });
  }

  if (filters.scoreMax !== null) {
    badges.push({
      key: "scoreMax",
      label: `HT Score <= ${filters.scoreMax}`,
      onRemove: removeScoreMax,
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((badge) => (
        <Badge
          key={badge.key}
          variant="secondary"
          className="pl-2.5 pr-1 py-1 text-xs font-normal gap-1"
        >
          {badge.label}
          <button
            type="button"
            onClick={badge.onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
            aria-label={`Remove ${badge.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAll}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  );
}
