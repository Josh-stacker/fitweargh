import { supabase } from "../supabase";

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  category: string;
  categories: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  colorSizeStock: Record<string, number>;
  imageUrl: string;
  imagePath: string;
  images: string[];
  imagePaths: string[];
  displayImageIndex: number;
  colorImageMap: Record<string, number | number[]>;
  description: string;
  createdAt: unknown;
}

interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  discount_price: number | string | null;
  category: string;
  categories: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  stock: number;
  color_size_stock: Record<string, number> | null;
  image_url: string;
  image_path: string;
  images: string[] | null;
  image_paths: string[] | null;
  display_image_index: number | null;
  color_image_map: Record<string, number | number[]> | null;
  description: string;
  created_at: string;
}

function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price ?? 0),
    discountPrice: row.discount_price == null ? null : Number(row.discount_price),
    category: row.category ?? "",
    categories: row.categories ?? [],
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stock: row.stock ?? 0,
    colorSizeStock: row.color_size_stock ?? {},
    imageUrl: row.image_url ?? "",
    imagePath: row.image_path ?? "",
    images: row.images ?? [],
    imagePaths: row.image_paths ?? [],
    displayImageIndex: row.display_image_index ?? 0,
    colorImageMap: row.color_image_map ?? {},
    description: row.description ?? "",
    createdAt: row.created_at,
  };
}

/** Fetch all products ordered by newest first. */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProductRow[]).map(productFromRow);
}

/** Fetch a single product by ID. Returns null if not found. */
export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return productFromRow(data as ProductRow);
}

/**
 * Returns true if the product belongs to the given category.
 * Checks both the `categories` array and the legacy `category` string.
 */
export function hasCategory(
  product: { category: string; categories?: string[] },
  category: string
): boolean {
  if (product.categories && product.categories.length > 0) {
    return product.categories.some(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
  }
  return product.category.toLowerCase() === category.toLowerCase();
}
