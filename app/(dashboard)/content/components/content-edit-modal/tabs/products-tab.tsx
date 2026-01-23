"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GripVertical,
  Trash2,
  Package,
  Plus,
  Search,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getBestListProducts,
  removeProductFromBestList,
  updateBestListProductPosition,
  updateBestListProduct,
  searchProducts,
  addProductToBestListById,
  addCustomProductToBestList,
  type BestListProduct,
  type ProductSearchResult,
} from "@/app/(dashboard)/products/actions";

interface ProductsTabProps {
  contentItemId: number | null;
}

export function ProductsTab({ contentItemId }: ProductsTabProps) {
  const [products, setProducts] = useState<BestListProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Add product dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTab, setAddTab] = useState<"search" | "custom">("search");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Custom product state
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");

  // Add product label/notes state
  const [addLabel, setAddLabel] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit product state
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const loadProducts = useCallback(async () => {
    if (!contentItemId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getBestListProducts(contentItemId);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, [contentItemId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Search products with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchProducts(searchQuery);
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRemove = async (bestListProductId: number) => {
    const result = await removeProductFromBestList(bestListProductId);
    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== bestListProductId));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newProducts = [...products];
    const [draggedItem] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(index, 0, draggedItem);
    setProducts(newProducts);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    const updates = products.map((product, index) => ({
      id: product.id,
      position: index,
    }));

    for (const update of updates) {
      await updateBestListProductPosition(update.id, update.position);
    }

    setDraggedIndex(null);
  };

  const resetAddDialog = () => {
    setSearchQuery("");
    setSearchResults([]);
    setCustomName("");
    setCustomBrand("");
    setAddLabel("");
    setAddNotes("");
    setAddTab("search");
  };

  const handleAddFromSearch = async (product: ProductSearchResult) => {
    if (!contentItemId) return;

    setAdding(true);
    try {
      const result = await addProductToBestListById(
        contentItemId,
        product.id,
        addLabel || undefined,
        addNotes || undefined
      );
      if (result.success) {
        await loadProducts();
        setAddDialogOpen(false);
        resetAddDialog();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleAddCustom = async () => {
    if (!contentItemId || !customName.trim()) return;

    setAdding(true);
    try {
      const result = await addCustomProductToBestList(
        contentItemId,
        customName.trim(),
        customBrand.trim() || undefined,
        addLabel || undefined,
        addNotes || undefined
      );
      if (result.success) {
        await loadProducts();
        setAddDialogOpen(false);
        resetAddDialog();
      }
    } finally {
      setAdding(false);
    }
  };

  const startEditing = (product: BestListProduct) => {
    setEditingProductId(product.id);
    setEditLabel(product.label || "");
    setEditNotes(product.notes || "");
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditLabel("");
    setEditNotes("");
  };

  const saveEditing = async () => {
    if (editingProductId === null) return;

    const result = await updateBestListProduct(editingProductId, {
      label: editLabel || null,
      notes: editNotes || null,
    });

    if (result.success) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId
            ? { ...p, label: editLabel || null, notes: editNotes || null }
            : p
        )
      );
      cancelEditing();
    }
  };

  const getProductName = (product: BestListProduct) => {
    if (product.product) {
      return product.product.full_name;
    }
    return product.custom_product_name || "Unknown Product";
  };

  const getBrandName = (product: BestListProduct) => {
    if (product.product) {
      return product.brand_name;
    }
    return product.custom_product_brand;
  };

  if (!contentItemId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Save this content item first to manage products.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading products...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {products.length > 0
            ? "Drag to reorder. Click edit to add labels and notes."
            : "Add products to this best list."}
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No products yet</p>
          <p className="text-sm mt-1">
            Click &quot;Add Product&quot; to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product, index) => (
            <div
              key={product.id}
              draggable={editingProductId !== product.id}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border bg-card transition-colors ${
                draggedIndex === index ? "opacity-50" : ""
              } ${editingProductId === product.id ? "" : "cursor-move hover:bg-accent/50"}`}
            >
              <div className="flex items-start gap-3 p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                <span className="text-sm font-medium text-muted-foreground w-6 mt-0.5">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {getProductName(product)}
                    </span>
                    {!product.product && (
                      <Badge variant="secondary" className="text-xs">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getBrandName(product) && (
                      <Badge variant="outline" className="text-xs">
                        {getBrandName(product)}
                      </Badge>
                    )}
                    {product.label && (
                      <Badge className="text-xs">{product.label}</Badge>
                    )}
                  </div>
                  {product.notes && editingProductId !== product.id && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {product.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingProductId === product.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={saveEditing}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                        onClick={() => startEditing(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Edit form */}
              {editingProductId === product.id && (
                <div className="px-3 pb-3 pt-1 border-t space-y-3">
                  <div>
                    <Label htmlFor="edit-label" className="text-xs">
                      Label
                    </Label>
                    <Input
                      id="edit-label"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="e.g., Overall Best, Best Value"
                      className="h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-notes" className="text-xs">
                      Notes
                    </Label>
                    <Textarea
                      id="edit-notes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Internal notes about this product..."
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetAddDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Search for a product in the database or add a custom one-off
              product.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={addTab}
            onValueChange={(v) => setAddTab(v as "search" | "custom")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                Search Database
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Plus className="h-4 w-4" />
                Custom Product
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="search-products">Search Products</Label>
                <Input
                  id="search-products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="mt-1"
                />
              </div>

              {searching && (
                <div className="text-sm text-muted-foreground">Searching...</div>
              )}

              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleAddFromSearch(result)}
                      disabled={adding}
                      className="w-full text-left px-3 py-2 hover:bg-accent border-b last:border-b-0 disabled:opacity-50"
                    >
                      <div className="font-medium">{result.full_name}</div>
                      {result.brand_name && (
                        <div className="text-xs text-muted-foreground">
                          {result.brand_name}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No products found. Try a different search or add a custom
                  product.
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="custom-name">Product Name *</Label>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter product name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="custom-brand">Brand</Label>
                <Input
                  id="custom-brand"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Enter brand name (optional)"
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t pt-4 space-y-3">
            <div className="text-sm font-medium">Optional Details</div>
            <div>
              <Label htmlFor="add-label" className="text-xs">
                Label
              </Label>
              <Input
                id="add-label"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="e.g., Overall Best, Best Value"
                className="h-8 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-notes" className="text-xs">
                Notes
              </Label>
              <Textarea
                id="add-notes"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                placeholder="Internal notes about this product..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            {addTab === "custom" && (
              <Button
                onClick={handleAddCustom}
                disabled={adding || !customName.trim()}
              >
                {adding ? "Adding..." : "Add Custom Product"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
