"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ProductRow,
  EvaluationScores,
} from "./types";
import {
  RATING_CATEGORIES,
  EVALUATION_METRICS,
  formatPrice,
} from "./types";

// Stats for a column
interface ColumnStats {
  min: number;
  max: number;
  mean: number;
}

// Delta text showing deviation from mean
function DeltaText({
  value,
  stats,
  invertColors = false,
  isPrice = false,
}: {
  value: number;
  stats: ColumnStats;
  invertColors?: boolean;
  isPrice?: boolean;
}) {
  const delta = value - stats.mean;
  const deltaStr = isPrice
    ? (delta >= 0 ? "+" : "") + Math.round(delta).toString()
    : delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

  const threshold = isPrice ? 10 : 0.1;
  const isGood = invertColors ? delta < -threshold : delta > threshold;
  const isBad = invertColors ? delta > threshold : delta < -threshold;

  const deltaColor = isGood
    ? "text-green-600 dark:text-green-400"
    : isBad
    ? "text-red-600 dark:text-red-400"
    : "text-muted-foreground";

  return (
    <span
      className={`text-[10px] tabular-nums ${deltaColor}`}
      title={`Mean: ${stats.mean.toFixed(2)}`}
    >
      {deltaStr}
    </span>
  );
}

// Rating cell with tooltip for comments
function RatingCell({
  rating,
  comment,
  stats,
}: {
  rating: number | null;
  comment?: string | null;
  stats?: ColumnStats | null;
}) {
  if (rating === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const content = (
    <div className="flex items-center gap-1">
      <span className={`font-medium tabular-nums ${comment ? "underline decoration-dotted decoration-muted-foreground/50" : ""}`}>
        {rating.toFixed(1)}
      </span>
      {stats && <DeltaText value={rating} stats={stats} />}
    </div>
  );

  if (!comment) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{content}</div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {comment}
      </TooltipContent>
    </Tooltip>
  );
}

// Score with delta text
function ScoreWithDelta({
  value,
  stats,
  colorClass,
  decimals = 1,
}: {
  value: number;
  stats: ColumnStats;
  colorClass?: string;
  decimals?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className={`tabular-nums ${colorClass || ""}`}>
        {value.toFixed(decimals)}
      </span>
      <DeltaText value={value} stats={stats} />
    </div>
  );
}

// Helper to compute average of initial and tuned scores for a given metric
function getEvalAverage(
  initial: EvaluationScores | null,
  tuned: EvaluationScores | null,
  metricKey: keyof EvaluationScores
): number | null {
  const initialVal = initial?.[metricKey] ?? null;
  const tunedVal = tuned?.[metricKey] ?? null;

  if (initialVal !== null && tunedVal !== null) {
    return (initialVal + tunedVal) / 2;
  } else if (initialVal !== null) {
    return initialVal;
  } else if (tunedVal !== null) {
    return tunedVal;
  }
  return null;
}

// Compute stats for all numeric columns from data
function computeAllStats(data: ProductRow[]): Map<string, ColumnStats> {
  const statsMap = new Map<string, ColumnStats>();

  // Helper to compute stats for a column
  const addStats = (key: string, values: (number | null | undefined)[]) => {
    const validVals = values.filter(
      (v): v is number => v !== null && v !== undefined
    );
    if (validVals.length > 0) {
      statsMap.set(key, {
        min: Math.min(...validVals),
        max: Math.max(...validVals),
        mean: validVals.reduce((a, b) => a + b, 0) / validVals.length,
      });
    }
  };

  // Price
  addStats("price", data.map((r) => r.price));

  // HT Score
  addStats("ht_score", data.map((r) => r.ht_rating?.ht_score ?? null));

  // Rating categories
  for (const cat of RATING_CATEGORIES) {
    addStats(
      `ht_${cat.key}`,
      data.map((r) => {
        const rating = r.ht_rating;
        if (!rating) return null;
        return rating[cat.key as keyof typeof rating] as number | null;
      })
    );
  }

  // Evaluation metrics
  for (const metric of EVALUATION_METRICS) {
    const key = metric.key as keyof EvaluationScores;

    // Initial
    addStats(
      `${metric.key}_initial`,
      data.map((r) => r.initial?.[key] ?? null)
    );

    // Tuned
    addStats(
      `${metric.key}_tuned`,
      data.map((r) => r.tuned?.[key] ?? null)
    );

    // Average
    addStats(
      `${metric.key}_avg`,
      data.map((r) => getEvalAverage(r.initial, r.tuned, key))
    );
  }

  return statsMap;
}

// Generate evaluation columns for each metric (Initial, Tuned, Average as separate sortable columns)
function generateEvalColumns(
  stats: Map<string, ColumnStats>
): ColumnDef<ProductRow>[] {
  const columns: ColumnDef<ProductRow>[] = [];

  for (const metric of EVALUATION_METRICS) {
    const initialStats = stats.get(`${metric.key}_initial`);
    const tunedStats = stats.get(`${metric.key}_tuned`);
    const avgStats = stats.get(`${metric.key}_avg`);

    // Initial column
    columns.push({
      id: `eval_${metric.key}_initial`,
      accessorFn: (row) =>
        row.initial?.[metric.key as keyof EvaluationScores] ?? null,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <div className="text-center">
            <div>{metric.label}</div>
            <div className="text-[10px] text-muted-foreground font-normal">
              Initial
            </div>
          </div>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const val =
          row.original.initial?.[metric.key as keyof EvaluationScores] ?? null;
        if (val === null)
          return <span className="text-muted-foreground">-</span>;
        if (!initialStats)
          return <span className="tabular-nums">{val.toFixed(1)}</span>;
        return <ScoreWithDelta value={val} stats={initialStats} />;
      },
    });

    // Tuned column
    columns.push({
      id: `eval_${metric.key}_tuned`,
      accessorFn: (row) =>
        row.tuned?.[metric.key as keyof EvaluationScores] ?? null,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <div className="text-center">
            <div>{metric.label}</div>
            <div className="text-[10px] text-muted-foreground font-normal">
              Tuned
            </div>
          </div>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const val =
          row.original.tuned?.[metric.key as keyof EvaluationScores] ?? null;
        if (val === null)
          return <span className="text-muted-foreground">-</span>;
        if (!tunedStats)
          return <span className="tabular-nums">{val.toFixed(1)}</span>;
        return <ScoreWithDelta value={val} stats={tunedStats} />;
      },
    });

    // Average column
    columns.push({
      id: `eval_${metric.key}_avg`,
      accessorFn: (row) =>
        getEvalAverage(
          row.initial,
          row.tuned,
          metric.key as keyof EvaluationScores
        ),
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <div className="text-center">
            <div>{metric.label}</div>
            <div className="text-[10px] text-muted-foreground font-normal">
              Average
            </div>
          </div>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const avg = getEvalAverage(
          row.original.initial,
          row.original.tuned,
          metric.key as keyof EvaluationScores
        );
        if (avg === null)
          return <span className="text-muted-foreground">-</span>;
        if (!avgStats)
          return (
            <span className="font-medium tabular-nums">{avg.toFixed(1)}</span>
          );
        return (
          <ScoreWithDelta value={avg} stats={avgStats} colorClass="font-medium" />
        );
      },
    });
  }

  return columns;
}

// Generate base columns with stats
function generateBaseColumns(
  stats: Map<string, ColumnStats>
): ColumnDef<ProductRow>[] {
  const priceStats = stats.get("price");
  const htScoreStats = stats.get("ht_score");

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="max-w-[250px] font-medium truncate">
          {row.original.full_name}
        </div>
      ),
    },
    {
      accessorKey: "brand_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Brand
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.brand_name}</Badge>
      ),
    },
    {
      accessorKey: "product_class",
      header: "Type",
      cell: ({ row }) => {
        const productClass = row.original.product_class;
        if (!productClass)
          return <span className="text-muted-foreground">-</span>;
        return (
          <Badge
            variant="outline"
            className={
              productClass === "OTC"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }
          >
            {productClass}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const price = row.getValue("price") as number | null;
        if (price === null)
          return <span className="text-muted-foreground">-</span>;

        return (
          <div className="flex items-center gap-1">
            <span className="tabular-nums">{formatPrice(price)}</span>
            {priceStats && <DeltaText value={price} stats={priceStats} invertColors isPrice />}
          </div>
        );
      },
    },
    {
      id: "ht_score",
      accessorFn: (row) => row.ht_rating?.ht_score ?? null,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            HT Score
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const score = row.original.ht_rating?.ht_score ?? null;
        if (score === null)
          return <span className="text-muted-foreground">-</span>;
        if (!htScoreStats) {
          return <span className="font-bold tabular-nums">{score.toFixed(1)}</span>;
        }
        return (
          <ScoreWithDelta
            value={score}
            stats={htScoreStats}
            colorClass="font-bold"
          />
        );
      },
    },
    // Generate columns for each HT rating category
    ...RATING_CATEGORIES.map((cat) => {
      const catStats = stats.get(`ht_${cat.key}`);
      return {
        id: `ht_${cat.key}`,
        accessorFn: (row: ProductRow) => {
          const rating = row.ht_rating;
          if (!rating) return null;
          return rating[cat.key as keyof typeof rating] as number | null;
        },
        header: ({
          column,
        }: {
          column: {
            toggleSorting: (desc: boolean) => void;
            getIsSorted: () => false | "asc" | "desc";
          };
        }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              {cat.label}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }: { row: { original: ProductRow } }) => {
          const rating = row.original.ht_rating;
          if (!rating) return <span className="text-muted-foreground">-</span>;
          const value = rating[cat.key as keyof typeof rating] as number | null;
          const commentKey = `${cat.key}_comment` as keyof typeof rating;
          const comment = rating[commentKey] as string | null;
          return <RatingCell rating={value} comment={comment} stats={catStats} />;
        },
      };
    }) as ColumnDef<ProductRow>[],
  ];
}

// Function to generate columns with stats computed from data
export function getColumns(data: ProductRow[]): ColumnDef<ProductRow>[] {
  const stats = computeAllStats(data);
  return [...generateBaseColumns(stats), ...generateEvalColumns(stats)];
}
