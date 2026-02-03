"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductFilters, ProductSegment, SortField } from "./components/types";

// ============================================================================
// Best List Types
// ============================================================================

export interface BestListContentItem {
  id: number;
  title: string;
  workflow_status: { name: string; color: string } | null;
}

export interface BestListProduct {
  id: number;
  content_id: number;
  product_id: number | null;
  position: number;
  label: string | null;
  notes: string | null;
  // For database products
  product: {
    id: number;
    full_name: string;
  } | null;
  brand_name: string | null;
  // For custom products
  custom_product_name: string | null;
  custom_product_brand: string | null;
}

export interface ProductSearchResult {
  id: number;
  full_name: string;
  brand_name: string | null;
}

// ============================================================================
// Best List Actions
// ============================================================================

export async function getBestListContentItems(): Promise<BestListContentItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cp_content")
    .select(`
      id,
      title,
      workflow_status:cp_workflow_statuses(name, color),
      content_type:cp_content_types!inner(slug)
    `)
    .eq("content_type.slug", "best-list")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching best list content items:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    workflow_status: item.workflow_status,
  }));
}

export async function addProductsToBestList(
  contentItemId: number,
  productIds: number[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get existing products for this best list to avoid duplicates
  const { data: existingProducts } = await supabase
    .from("cp_best_list_products")
    .select("product_id, position")
    .eq("content_id", contentItemId);

  const existingProductIds = new Set(
    (existingProducts || [])
      .filter((p) => p.product_id !== null)
      .map((p) => p.product_id)
  );

  // Filter out products that already exist
  const newProductIds = productIds.filter((id) => !existingProductIds.has(id));

  if (newProductIds.length === 0) {
    // All products already exist
    return { success: true };
  }

  // Get current max position
  const maxPosition = Math.max(
    -1,
    ...(existingProducts || []).map((p) => p.position)
  );
  let nextPosition = maxPosition + 1;

  // Insert only new products
  const inserts = newProductIds.map((productId) => ({
    content_id: contentItemId,
    product_id: productId,
    position: nextPosition++,
  }));

  const { error } = await supabase
    .from("cp_best_list_products")
    .insert(inserts);

  if (error) {
    console.error("Error adding products to best list:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/content");
  return { success: true };
}

export async function replaceProductsInBestList(
  contentItemId: number,
  productIds: number[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Delete existing products for this best list
  const { error: deleteError } = await supabase
    .from("cp_best_list_products")
    .delete()
    .eq("content_id", contentItemId);

  if (deleteError) {
    console.error("Error clearing best list products:", deleteError);
    return { success: false, error: deleteError.message };
  }

  // Insert new products with positions
  const inserts = productIds.map((productId, index) => ({
    content_id: contentItemId,
    product_id: productId,
    position: index,
  }));

  const { error: insertError } = await supabase
    .from("cp_best_list_products")
    .insert(inserts);

  if (insertError) {
    console.error("Error inserting best list products:", insertError);
    return { success: false, error: insertError.message };
  }

  revalidatePath("/products");
  revalidatePath("/content");
  return { success: true };
}

export async function getBestListProducts(
  contentItemId: number
): Promise<BestListProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cp_best_list_products")
    .select(`
      id,
      content_id,
      product_id,
      position,
      label,
      notes,
      custom_product_name,
      custom_product_brand,
      product:products(
        id,
        full_name,
        model:models(
          release:releases(
            brand:brands(name)
          )
        )
      )
    `)
    .eq("content_id", contentItemId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching best list products:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    id: item.id,
    content_id: item.content_id,
    product_id: item.product_id,
    position: item.position,
    label: item.label,
    notes: item.notes,
    custom_product_name: item.custom_product_name,
    custom_product_brand: item.custom_product_brand,
    product: item.product ? {
      id: item.product.id,
      full_name: item.product.full_name,
    } : null,
    brand_name: item.product?.model?.release?.brand?.name || null,
  }));
}

export async function removeProductFromBestList(
  bestListProductId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cp_best_list_products")
    .delete()
    .eq("id", bestListProductId);

  if (error) {
    console.error("Error removing product from best list:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/content");
  return { success: true };
}

export async function updateBestListProductPosition(
  bestListProductId: number,
  newPosition: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cp_best_list_products")
    .update({ position: newPosition })
    .eq("id", bestListProductId);

  if (error) {
    console.error("Error updating product position:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/content");
  return { success: true };
}

export async function updateBestListProduct(
  bestListProductId: number,
  updates: { label?: string | null; notes?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cp_best_list_products")
    .update(updates)
    .eq("id", bestListProductId);

  if (error) {
    console.error("Error updating best list product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/content");
  return { success: true };
}

export async function searchProducts(
  query: string,
  limit: number = 10
): Promise<ProductSearchResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      full_name,
      model:models(
        release:releases(
          brand:brands(name)
        )
      )
    `)
    .ilike("full_name", `%${query}%`)
    .limit(limit);

  if (error) {
    console.error("Error searching products:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    id: item.id,
    full_name: item.full_name,
    brand_name: item.model?.release?.brand?.name || null,
  }));
}

export async function addProductToBestListById(
  contentItemId: number,
  productId: number,
  label?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; id?: number }> {
  const supabase = await createClient();

  // Get current max position
  const { data: existing } = await supabase
    .from("cp_best_list_products")
    .select("position")
    .eq("content_id", contentItemId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("cp_best_list_products")
    .insert({
      content_id: contentItemId,
      product_id: productId,
      position: nextPosition,
      label: label || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding product to best list:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/content");
  return { success: true, id: data.id };
}

export async function addCustomProductToBestList(
  contentItemId: number,
  customProductName: string,
  customProductBrand?: string,
  label?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; id?: number }> {
  const supabase = await createClient();

  // Get current max position
  const { data: existing } = await supabase
    .from("cp_best_list_products")
    .select("position")
    .eq("content_id", contentItemId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("cp_best_list_products")
    .insert({
      content_id: contentItemId,
      custom_product_name: customProductName,
      custom_product_brand: customProductBrand || null,
      position: nextPosition,
      label: label || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding custom product to best list:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/content");
  return { success: true, id: data.id };
}

export async function getSegments(): Promise<ProductSegment[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("product_segments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching segments:", error);
    return [];
  }

  return data.map((segment) => ({
    id: segment.id,
    name: segment.name,
    filters: segment.filters as ProductFilters,
    sort_primary: segment.sort_primary as SortField | null,
    sort_primary_desc: segment.sort_primary_desc ?? true,
    sort_secondary: segment.sort_secondary as SortField | null,
    sort_secondary_desc: segment.sort_secondary_desc ?? true,
    created_at: segment.created_at,
    updated_at: segment.updated_at,
  }));
}

export async function saveSegment(
  name: string,
  filters: ProductFilters,
  sortPrimary: SortField | null,
  sortPrimaryDesc: boolean,
  sortSecondary: SortField | null,
  sortSecondaryDesc: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("product_segments").insert({
    user_id: user.id,
    name,
    filters,
    sort_primary: sortPrimary,
    sort_primary_desc: sortPrimaryDesc,
    sort_secondary: sortSecondary,
    sort_secondary_desc: sortSecondaryDesc,
  });

  if (error) {
    console.error("Error saving segment:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function deleteSegment(
  segmentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("product_segments")
    .delete()
    .eq("id", segmentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting segment:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}
