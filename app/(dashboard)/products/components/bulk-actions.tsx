"use client";

import * as React from "react";
import { ChevronDown, ListPlus, Replace, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getBestListContentItems,
  getBestListProducts,
  addProductsToBestList,
  replaceProductsInBestList,
  type BestListContentItem,
  type BestListProduct,
} from "../actions";

interface BulkActionsProps {
  selectedProductIds: number[];
  onActionComplete?: () => void;
}

type BulkAction = "add-to-best-list" | "replace-best-list";
type DialogStep = "select-list" | "confirm-replace";

export function BulkActions({
  selectedProductIds,
  onActionComplete,
}: BulkActionsProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentAction, setCurrentAction] = React.useState<BulkAction | null>(null);
  const [dialogStep, setDialogStep] = React.useState<DialogStep>("select-list");
  const [bestLists, setBestLists] = React.useState<BestListContentItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // For replace confirmation
  const [selectedList, setSelectedList] = React.useState<BestListContentItem | null>(null);
  const [currentProducts, setCurrentProducts] = React.useState<BestListProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(false);

  const selectedCount = selectedProductIds.length;

  const resetDialog = () => {
    setDialogStep("select-list");
    setSelectedList(null);
    setCurrentProducts([]);
  };

  const handleActionClick = async (action: BulkAction) => {
    setCurrentAction(action);
    resetDialog();
    setDialogOpen(true);
    setLoading(true);

    try {
      const lists = await getBestListContentItems();
      setBestLists(lists);
    } catch (error) {
      console.error("Error fetching best lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBestList = async (list: BestListContentItem) => {
    if (currentAction === "add-to-best-list") {
      // Add action - execute immediately
      await executeAction(list.id);
    } else {
      // Replace action - show confirmation with current products
      setSelectedList(list);
      setLoadingProducts(true);
      setDialogStep("confirm-replace");

      try {
        const products = await getBestListProducts(list.id);
        setCurrentProducts(products);
      } catch (error) {
        console.error("Error fetching current products:", error);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const executeAction = async (contentItemId: number) => {
    setSubmitting(true);

    try {
      let result;
      if (currentAction === "add-to-best-list") {
        result = await addProductsToBestList(contentItemId, selectedProductIds);
      } else {
        result = await replaceProductsInBestList(contentItemId, selectedProductIds);
      }

      if (result.success) {
        setDialogOpen(false);
        resetDialog();
        onActionComplete?.();
      } else {
        console.error("Error:", result.error);
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReplace = () => {
    if (selectedList) {
      executeAction(selectedList.id);
    }
  };

  const getProductDisplayName = (product: BestListProduct) => {
    if (product.product) {
      return product.product.full_name;
    }
    return product.custom_product_name || "Unknown Product";
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Bulk Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>
            {selectedCount} product{selectedCount !== 1 ? "s" : ""} selected
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleActionClick("add-to-best-list")}>
            <ListPlus className="mr-2 h-4 w-4" />
            Add to best list
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleActionClick("replace-best-list")}>
            <Replace className="mr-2 h-4 w-4" />
            Replace best list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          {dialogStep === "select-list" ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {currentAction === "add-to-best-list"
                    ? "Add to Best List"
                    : "Replace Best List"}
                </DialogTitle>
                <DialogDescription>
                  {currentAction === "add-to-best-list"
                    ? `Add ${selectedCount} product${selectedCount !== 1 ? "s" : ""} to an existing best list.`
                    : `Select a best list to replace with ${selectedCount} product${selectedCount !== 1 ? "s" : ""}.`}
                </DialogDescription>
              </DialogHeader>

              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading best lists...
                </div>
              ) : bestLists.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No best list content items found. Create a content item with type
                  &quot;Best List&quot; first.
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-1">
                    {bestLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => handleSelectBestList(list)}
                        disabled={submitting}
                        className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="font-medium truncate">{list.title}</span>
                        {list.workflow_status && (
                          <span
                            className="ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: `${list.workflow_status.color}20`,
                              color: list.workflow_status.color,
                            }}
                          >
                            {list.workflow_status.name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Confirm Replace
                </DialogTitle>
                <DialogDescription>
                  You are about to replace all products in &quot;{selectedList?.title}&quot;.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="text-sm font-medium mb-2">Current List Status</div>
                  {loadingProducts ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : currentProducts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      This list is empty.
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground mb-2">
                        {currentProducts.length} product{currentProducts.length !== 1 ? "s" : ""} will be removed:
                      </div>
                      <ScrollArea className="max-h-[150px]">
                        <ul className="text-sm space-y-1">
                          {currentProducts.map((product, index) => (
                            <li key={product.id} className="flex items-center gap-2">
                              <span className="text-muted-foreground">{index + 1}.</span>
                              <span className="truncate">{getProductDisplayName(product)}</span>
                              {product.label && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  {product.label}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </>
                  )}
                </div>

                <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/30">
                  <div className="text-sm font-medium mb-1 text-green-700 dark:text-green-400">
                    New List
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-500">
                    {selectedCount} product{selectedCount !== 1 ? "s" : ""} will be added
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setDialogStep("select-list")}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmReplace}
                  disabled={submitting || loadingProducts}
                >
                  {submitting ? "Replacing..." : "Replace List"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
