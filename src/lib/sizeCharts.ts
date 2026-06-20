export interface SizeChartRow {
  size: string;
  label: string;
  value: string;
}

export interface SizeChart {
  id: string;
  name: string;
  labelHeading?: string;
  valueHeading?: string;
  rows: SizeChartRow[];
  categories: string[];
  subcategories: string[];
}

export const DEFAULT_SIZE_CHART: SizeChart = {
  id: "default",
  name: "Default UK Guide",
  labelHeading: "UK Label",
  valueHeading: "UK Dress Size",
  categories: [],
  subcategories: [],
  rows: [
    { size: "S", label: "UK Small", value: "8 - 10" },
    { size: "M", label: "UK Medium", value: "10 - 12" },
    { size: "L", label: "UK Large", value: "14 - 16" },
    { size: "XL", label: "UK Extra Large", value: "16 - 18" },
    { size: "XXL", label: "UK XXL", value: "20" },
  ],
};

export const WAIST_TRAINER_SIZE_CHART: SizeChart = {
  id: "waist-trainers-single-removable-belt",
  name: "Waist Trainers - Single Removable Belt",
  labelHeading: "Waist (inch)",
  valueHeading: "Dress Size (UK)",
  categories: ["Body Shapers"],
  subcategories: ["Waist Trainers"],
  rows: [
    { size: "XS", label: "22 - 25", value: "4" },
    { size: "S", label: "25 - 27.5", value: "6 - 8" },
    { size: "M", label: "28 - 30.5", value: "8 - 10" },
    { size: "L", label: "31 - 33", value: "12" },
    { size: "XL", label: "33 - 36.5", value: "12 - 14" },
    { size: "2XL", label: "36.5 - 38", value: "14 - 16" },
    { size: "3XL", label: "38 - 40", value: "16" },
    { size: "4XL", label: "40.5 - 42", value: "18" },
    { size: "5XL", label: "43 - 45", value: "18 - 20" },
    { size: "6XL", label: "45 - 48", value: "20 - 22" },
    { size: "7XL", label: "48 - 51", value: "22 - 24" },
  ],
};

export const KNEE_SLEEVE_SIZE_CHART: SizeChart = {
  id: "knee-sleeve-brace",
  name: "Knee Sleeve / Brace",
  labelHeading: "Circumference (in)",
  valueHeading: "Circumference (cm)",
  categories: ["Accessories"],
  subcategories: ["Knee Sleeves", "Knee Braces"],
  rows: [
    { size: "S",   label: "11.8 – 13.0 in", value: "30 – 33 cm" },
    { size: "M",   label: "13.0 – 14.2 in", value: "33 – 36 cm" },
    { size: "L",   label: "14.2 – 15.7 in", value: "36 – 40 cm" },
    { size: "XL",  label: "15.7 – 17.0 in", value: "40 – 44 cm" },
    { size: "XXL", label: "17.0 – 18.3 in", value: "44 – 47 cm" },
  ],
};

export const BUILT_IN_SIZE_CHARTS = [
  DEFAULT_SIZE_CHART,
  WAIST_TRAINER_SIZE_CHART,
  KNEE_SLEEVE_SIZE_CHART,
];

export function mergeBuiltInSizeCharts(charts?: SizeChart[]) {
  const saved = charts ?? [];
  const savedIds = new Set(saved.map((chart) => chart.id));
  return [
    ...BUILT_IN_SIZE_CHARTS.filter((chart) => !savedIds.has(chart.id)),
    ...saved,
  ];
}

export function resolveSizeChart({
  charts,
  productChartId,
  categories,
  subcategories,
}: {
  charts: SizeChart[];
  productChartId?: string | null;
  categories?: string[];
  subcategories?: string[];
}) {
  const activeCharts = mergeBuiltInSizeCharts(charts);
  const direct = productChartId ? activeCharts.find((chart) => chart.id === productChartId) : null;
  if (direct) return direct;

  const subcategoryMatch = activeCharts.find((chart) =>
    chart.subcategories.some((sub) => (subcategories ?? []).includes(sub)),
  );
  if (subcategoryMatch) return subcategoryMatch;

  const categoryMatch = activeCharts.find((chart) =>
    chart.categories.some((cat) => (categories ?? []).includes(cat)),
  );
  if (categoryMatch) return categoryMatch;

  return activeCharts[0] ?? DEFAULT_SIZE_CHART;
}

/**
 * Ensures all BUILT_IN_SIZE_CHARTS are present in the Supabase site_settings
 * size_charts record. Safe to call on every app load — only writes if a chart
 * is missing (identified by id).
 */
export async function seedBuiltInSizeCharts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "size_charts")
    .maybeSingle();

  const existing: SizeChart[] = (data?.value as { charts?: SizeChart[] } | null)?.charts ?? [];
  const existingIds = new Set(existing.map((c) => c.id));
  const missing = BUILT_IN_SIZE_CHARTS.filter((c) => !existingIds.has(c.id));
  if (missing.length === 0) return;

  const merged = [...existing, ...missing];
  await supabase
    .from("site_settings")
    .upsert({ key: "size_charts", value: { charts: merged } }, { onConflict: "key" });
}
