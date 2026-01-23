// Evaluation scores from the evaluations table
export interface EvaluationScores {
  speech_in_quiet: number | null;
  speech_in_noise: number | null;
  music_streaming: number | null;
  feedback_handling: number | null;
  own_voice: number | null;
}

// HT Rating data from the ht_ratings table
export interface HtRatingData {
  ht_score: number | null;
  sound_score: number | null;
  sound_score_comment: string | null;
  build_quality: number | null;
  build_quality_comment: string | null;
  battery: number | null;
  battery_comment: string | null;
  bluetooth: number | null;
  bluetooth_comment: string | null;
  app_features: number | null;
  app_features_comment: string | null;
  comfort: number | null;
  comfort_comment: string | null;
  design: number | null;
  design_comment: string | null;
  pro_support: number | null;
  pro_support_comment: string | null;
  handling: number | null;
  handling_comment: string | null;
  value: number | null;
  value_comment: string | null;
}

// Product row for display in the table
export interface ProductRow {
  id: number;
  name: string;
  full_name: string;
  slug: string;
  brand_name: string;
  model_name: string;
  form_factor: string;
  form_factor_category: string;
  product_type: string;
  product_class: "OTC" | "Rx" | null;
  hearing_loss_levels: string[];
  score: number | null;
  sound_score: number | null;
  price: number | null;
  features: ProductFeatures;
  // HT Rating data
  ht_rating: HtRatingData | null;
  // Evaluation scores
  initial: EvaluationScores | null;
  tuned: EvaluationScores | null;
}

// Hardware features as booleans for filtering
export interface ProductFeatures {
  rechargeable: boolean;
  telecoil: boolean;
  bluetooth: boolean;
  hands_free: boolean;
  tap_controls: boolean;
  voice_assistant: boolean;
  disposable_batteries: boolean;
  ip_rating_liquid: string | null;
  ip_rating_solid: string | null;
  push_button: boolean;
  volume_rocker: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
}

// Filter state
export interface ProductFilters {
  search: string;
  brands: string[];
  productTypes: string[];
  productClasses: ("OTC" | "Rx")[];
  formFactors: string[];
  hearingLossLevels: string[];
  features: Partial<{
    rechargeable: boolean;
    telecoil: boolean;
    bluetooth: boolean;
    hands_free: boolean;
    tap_controls: boolean;
    voice_assistant: boolean;
    disposable_batteries: boolean;
    push_button: boolean;
    volume_rocker: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
  }>;
  priceMin: number | null;
  priceMax: number | null;
  scoreMin: number | null;
  scoreMax: number | null;
}

// Segment (saved filter + sort)
export interface ProductSegment {
  id: string;
  name: string;
  filters: ProductFilters;
  sort_primary: string | null;
  sort_primary_desc: boolean;
  sort_secondary: string | null;
  sort_secondary_desc: boolean;
  created_at: string;
  updated_at: string;
}

// Sort options available
export type SortField =
  | "ht_score"
  | "price"
  | "brand_name"
  | "full_name";

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "ht_score", label: "HT Score" },
  { value: "price", label: "Price" },
  { value: "brand_name", label: "Brand" },
  { value: "full_name", label: "Product Name" },
];

// Feature groups for the filter panel
export const FEATURE_GROUPS = {
  power: [
    { key: "rechargeable", label: "Rechargeable" },
    { key: "disposable_batteries", label: "Disposable Batteries" },
  ],
  connectivity: [
    { key: "bluetooth", label: "Bluetooth Audio" },
    { key: "hands_free", label: "Hands-Free Calling" },
    { key: "voice_assistant", label: "Voice Assistant" },
  ],
  controls: [
    { key: "tap_controls", label: "Tap Controls" },
    { key: "push_button", label: "Push Button" },
    { key: "volume_rocker", label: "Volume Rocker" },
  ],
  sensors: [
    { key: "accelerometer", label: "Accelerometer" },
    { key: "gyroscope", label: "Gyroscope" },
  ],
  other: [{ key: "telecoil", label: "Telecoil" }],
} as const;

// Default filter state
export const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  brands: [],
  productTypes: [],
  productClasses: [],
  formFactors: [],
  hearingLossLevels: [],
  features: {},
  priceMin: null,
  priceMax: null,
  scoreMin: null,
  scoreMax: null,
};

// HT Rating categories for column generation
export const RATING_CATEGORIES = [
  { key: "sound_score", label: "Sound" },
  { key: "build_quality", label: "Build" },
  { key: "battery", label: "Battery" },
  { key: "bluetooth", label: "Bluetooth" },
  { key: "app_features", label: "App" },
  { key: "comfort", label: "Comfort" },
  { key: "design", label: "Design" },
  { key: "pro_support", label: "Support" },
  { key: "handling", label: "Handling" },
  { key: "value", label: "Value" },
] as const;

// Evaluation metrics for column generation
export const EVALUATION_METRICS = [
  { key: "speech_in_quiet", label: "Speech Quiet" },
  { key: "speech_in_noise", label: "Speech Noise" },
  { key: "music_streaming", label: "Music" },
  { key: "feedback_handling", label: "Feedback" },
  { key: "own_voice", label: "Own Voice" },
] as const;

// Helper function to format price
export function formatPrice(price: number | null): string {
  if (price === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
