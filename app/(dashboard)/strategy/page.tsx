"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryStates, parseAsString } from "nuqs";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StrategyTabs } from "./components/strategy-tabs";
import { CampaignGrid } from "./components/campaigns/campaign-grid";
import { CampaignFormDialog } from "./components/campaigns/campaign-form-dialog";
import { IdeaList } from "./components/ideas/idea-list";
import { IdeaFormDialog } from "./components/ideas/idea-form-dialog";
import { BriefTable } from "./components/briefs/brief-table";
import { BriefFormDialog } from "./components/briefs/brief-form-dialog";
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  quickCreateCampaign,
  getIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  voteOnIdea,
  convertIdeaToBrief,
  getBriefs,
  createBrief,
  updateBrief,
  deleteBrief,
  getStrategyFilterOptions,
} from "./actions";
import type {
  CampaignSummary,
  CampaignInput,
  ContentIdea,
  ContentIdeaInput,
  ContentBrief,
  ContentBriefInput,
  StrategyFilterOptions,
  StrategyTab,
} from "./components/types";

const tabParsers = {
  tab: parseAsString.withDefault("campaigns"),
};

export default function StrategyPage() {
  const [urlState, setUrlState] = useQueryStates(tabParsers, {
    history: "push",
  });

  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [filterOptions, setFilterOptions] = useState<StrategyFilterOptions>({
    contentTypes: [],
    campaigns: [],
  });
  const [localCampaigns, setLocalCampaigns] = useState<
    Array<{ id: number; name: string; color: string }>
  >([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync localCampaigns with filterOptions
  useEffect(() => {
    setLocalCampaigns(filterOptions.campaigns);
  }, [filterOptions.campaigns]);

  // Quick create campaign handler for inline creation in dropdowns
  const handleQuickCreateCampaign = async (name: string): Promise<string | null> => {
    const result = await quickCreateCampaign(name);
    if (result.success && result.id) {
      const newCampaign = {
        id: result.id,
        name,
        color: result.color || "#6366f1",
      };
      setLocalCampaigns((prev) =>
        [...prev, newCampaign].sort((a, b) => a.name.localeCompare(b.name))
      );
      // Also refresh the data to get updated campaign list
      fetchData();
      return result.id.toString();
    }
    return null;
  };

  // Dialog states
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignSummary | null>(null);
  const [deleteCampaignDialogOpen, setDeleteCampaignDialogOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignSummary | null>(null);

  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [deleteIdeaDialogOpen, setDeleteIdeaDialogOpen] = useState(false);
  const [deletingIdea, setDeletingIdea] = useState<ContentIdea | null>(null);

  const [briefDialogOpen, setBriefDialogOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState<ContentBrief | null>(null);
  const [deleteBriefDialogOpen, setDeleteBriefDialogOpen] = useState(false);
  const [deletingBrief, setDeletingBrief] = useState<ContentBrief | null>(null);

  const activeTab = urlState.tab as StrategyTab;

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      const options = await getStrategyFilterOptions();
      setFilterOptions(options);
    };
    fetchOptions();
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [campaignsData, ideasData, briefsData] = await Promise.all([
      getCampaigns(),
      getIdeas(),
      getBriefs(),
    ]);
    setCampaigns(campaignsData);
    setIdeas(ideasData);
    setBriefs(briefsData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab counts
  const counts = useMemo(
    () => ({
      campaigns: campaigns.length,
      ideas: ideas.filter((i) => i.status !== "converted" && i.status !== "rejected")
        .length,
      briefs: briefs.filter((b) => b.status !== "completed").length,
    }),
    [campaigns, ideas, briefs]
  );

  // Campaign handlers
  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignDialogOpen(true);
  };

  const handleEditCampaign = (campaign: CampaignSummary) => {
    setEditingCampaign(campaign);
    setCampaignDialogOpen(true);
  };

  const handleDeleteCampaignClick = (campaign: CampaignSummary) => {
    setDeletingCampaign(campaign);
    setDeleteCampaignDialogOpen(true);
  };

  const handleCampaignSubmit = async (input: CampaignInput) => {
    if (editingCampaign) {
      await updateCampaign(editingCampaign.campaign_id, input);
    } else {
      await createCampaign(input);
    }
    await fetchData();
  };

  const handleConfirmDeleteCampaign = async () => {
    if (deletingCampaign) {
      await deleteCampaign(deletingCampaign.campaign_id);
      await fetchData();
      setDeleteCampaignDialogOpen(false);
      setDeletingCampaign(null);
    }
  };

  // Idea handlers
  const handleCreateIdea = () => {
    setEditingIdea(null);
    setIdeaDialogOpen(true);
  };

  const handleEditIdea = (idea: ContentIdea) => {
    setEditingIdea(idea);
    setIdeaDialogOpen(true);
  };

  const handleDeleteIdeaClick = (idea: ContentIdea) => {
    setDeletingIdea(idea);
    setDeleteIdeaDialogOpen(true);
  };

  const handleIdeaSubmit = async (input: ContentIdeaInput) => {
    if (editingIdea) {
      await updateIdea(editingIdea.id, input);
    } else {
      await createIdea(input);
    }
    await fetchData();
  };

  const handleConfirmDeleteIdea = async () => {
    if (deletingIdea) {
      await deleteIdea(deletingIdea.id);
      await fetchData();
      setDeleteIdeaDialogOpen(false);
      setDeletingIdea(null);
    }
  };

  const handleVoteOnIdea = async (ideaId: number, vote: 1 | -1) => {
    await voteOnIdea(ideaId, vote);
    await fetchData();
  };

  const handleConvertIdeaToBrief = async (idea: ContentIdea) => {
    const result = await convertIdeaToBrief(idea.id);
    if (result.success) {
      await fetchData();
      setUrlState({ tab: "briefs" });
    }
  };

  // Brief handlers
  const handleCreateBrief = () => {
    setEditingBrief(null);
    setBriefDialogOpen(true);
  };

  const handleEditBrief = (brief: ContentBrief) => {
    setEditingBrief(brief);
    setBriefDialogOpen(true);
  };

  const handleViewBrief = (brief: ContentBrief) => {
    handleEditBrief(brief);
  };

  const handleDeleteBriefClick = (brief: ContentBrief) => {
    setDeletingBrief(brief);
    setDeleteBriefDialogOpen(true);
  };

  const handleBriefSubmit = async (input: ContentBriefInput) => {
    if (editingBrief) {
      await updateBrief(editingBrief.id, input);
    } else {
      await createBrief(input);
    }
    await fetchData();
  };

  const handleConfirmDeleteBrief = async () => {
    if (deletingBrief) {
      await deleteBrief(deletingBrief.id);
      await fetchData();
      setDeleteBriefDialogOpen(false);
      setDeletingBrief(null);
    }
  };

  const handleCreateContentFromBrief = (brief: ContentBrief) => {
    // Navigate to content page with brief pre-selected
    // For now, just show a message
    window.location.href = `/content?brief_id=${brief.id}`;
  };

  // Get create button label
  const getCreateLabel = () => {
    switch (activeTab) {
      case "campaigns":
        return "New campaign";
      case "ideas":
        return "Submit idea";
      case "briefs":
        return "New brief";
    }
  };

  const handleCreate = () => {
    switch (activeTab) {
      case "campaigns":
        handleCreateCampaign();
        break;
      case "ideas":
        handleCreateIdea();
        break;
      case "briefs":
        handleCreateBrief();
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Strategy
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan campaigns, collect ideas, and create content briefs
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          {getCreateLabel()}
        </Button>
      </div>

      {/* Tabs */}
      <StrategyTabs
        activeTab={activeTab}
        onTabChange={(tab) => setUrlState({ tab })}
        counts={counts}
      />

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : activeTab === "campaigns" ? (
        <CampaignGrid
          campaigns={campaigns}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaignClick}
          onCreateNew={handleCreateCampaign}
        />
      ) : activeTab === "ideas" ? (
        <IdeaList
          ideas={ideas}
          userId={userId}
          onEdit={handleEditIdea}
          onDelete={handleDeleteIdeaClick}
          onConvertToBrief={handleConvertIdeaToBrief}
          onVote={handleVoteOnIdea}
          onCreateNew={handleCreateIdea}
        />
      ) : (
        <BriefTable
          data={briefs}
          onEdit={handleEditBrief}
          onDelete={handleDeleteBriefClick}
          onView={handleViewBrief}
          onCreateContent={handleCreateContentFromBrief}
          onCreateNew={handleCreateBrief}
        />
      )}

      {/* Campaign Dialogs */}
      <CampaignFormDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        campaign={editingCampaign}
        onSubmit={handleCampaignSubmit}
      />
      <ConfirmDialog
        open={deleteCampaignDialogOpen}
        onOpenChange={setDeleteCampaignDialogOpen}
        title="Delete campaign"
        description={`Are you sure you want to delete "${deletingCampaign?.name}"? This will not delete associated content items.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDeleteCampaign}
        variant="destructive"
      />

      {/* Idea Dialogs */}
      <IdeaFormDialog
        open={ideaDialogOpen}
        onOpenChange={setIdeaDialogOpen}
        idea={editingIdea}
        filterOptions={filterOptions}
        localCampaigns={localCampaigns}
        onCreateCampaign={handleQuickCreateCampaign}
        onSubmit={handleIdeaSubmit}
      />
      <ConfirmDialog
        open={deleteIdeaDialogOpen}
        onOpenChange={setDeleteIdeaDialogOpen}
        title="Delete idea"
        description={`Are you sure you want to delete "${deletingIdea?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDeleteIdea}
        variant="destructive"
      />

      {/* Brief Dialogs */}
      <BriefFormDialog
        open={briefDialogOpen}
        onOpenChange={setBriefDialogOpen}
        brief={editingBrief}
        filterOptions={filterOptions}
        localCampaigns={localCampaigns}
        onCreateCampaign={handleQuickCreateCampaign}
        onSubmit={handleBriefSubmit}
      />
      <ConfirmDialog
        open={deleteBriefDialogOpen}
        onOpenChange={setDeleteBriefDialogOpen}
        title="Delete brief"
        description={`Are you sure you want to delete "${deletingBrief?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDeleteBrief}
        variant="destructive"
      />
    </div>
  );
}
