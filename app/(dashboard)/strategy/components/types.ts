// Campaign from cp_campaigns
export interface Campaign {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  goals: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "planning" | "active" | "completed" | "cancelled";
  color: string;
  created_at: string;
  updated_at: string;
}

// Campaign summary from cp_campaign_summary view
export interface CampaignSummary {
  campaign_id: number;
  slug: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "completed" | "cancelled";
  color: string;
  start_date: string | null;
  end_date: string | null;
  release_name: string | null;
  total_content_items: number;
  published_items: number;
  draft_items: number;
  in_progress_items: number;
  scheduled_items: number;
  total_ideas: number;
  approved_ideas: number;
  total_briefs: number;
  calendar_events: number;
  completion_percentage: number;
}

// Campaign input for create/update
export interface CampaignInput {
  name: string;
  slug?: string;
  description?: string | null;
  goals?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: Campaign["status"];
  color?: string;
}

// Content idea from cp_content_ideas
export interface ContentIdea {
  id: number;
  title: string;
  description: string | null;
  source: string | null;
  potential_keywords: string[];
  target_audience: string | null;
  estimated_effort: "low" | "medium" | "high" | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "submitted" | "under_review" | "approved" | "rejected" | "converted";
  content_type: ContentType | null;
  campaign: CampaignRef | null;
  vote_count: number;
  votes: IdeaVote[];
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaVote {
  user_id: string;
  vote: 1 | -1;
  timestamp: string;
}

// Content idea input for create/update
export interface ContentIdeaInput {
  title: string;
  description?: string | null;
  source?: string | null;
  potential_keywords?: string[];
  target_audience?: string | null;
  estimated_effort?: ContentIdea["estimated_effort"];
  priority?: ContentIdea["priority"];
  status?: ContentIdea["status"];
  content_type_id?: number | null;
  campaign_id?: number | null;
  notes?: string | null;
}

// Content brief from cp_content_briefs
export interface ContentBrief {
  id: number;
  title: string;
  slug: string | null;
  summary: string | null;
  target_audience: string | null;
  content_goals: string | null;
  tone_and_style: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[];
  search_intent: string | null;
  target_word_count: number | null;
  outline: BriefOutlineSection[];
  required_sections: string[];
  internal_links: string[];
  external_references: string[];
  status: "draft" | "ready" | "assigned" | "in_progress" | "completed";
  content_type: ContentType | null;
  campaign: CampaignRef | null;
  idea: IdeaRef | null;
  competitor_examples: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BriefOutlineSection {
  heading: string;
  subheadings?: string[];
  notes?: string;
}

// Content brief input for create/update
export interface ContentBriefInput {
  title: string;
  slug?: string | null;
  summary?: string | null;
  target_audience?: string | null;
  content_goals?: string | null;
  tone_and_style?: string | null;
  primary_keyword?: string | null;
  secondary_keywords?: string[];
  search_intent?: string | null;
  target_word_count?: number | null;
  outline?: BriefOutlineSection[];
  required_sections?: string[];
  status?: ContentBrief["status"];
  content_type_id?: number | null;
  campaign_id?: number | null;
  idea_id?: number | null;
  notes?: string | null;
}

// Reference types (simplified for relationships)
export interface ContentType {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
}

export interface CampaignRef {
  id: number;
  name: string;
  color: string;
}

export interface IdeaRef {
  id: number;
  title: string;
}

// Filter options
export interface StrategyFilterOptions {
  contentTypes: ContentType[];
  campaigns: CampaignRef[];
}

// Tab types
export type StrategyTab = "campaigns" | "ideas" | "briefs";

// Idea filters
export interface IdeaFilters {
  search: string;
  statuses: ContentIdea["status"][];
  priorities: ContentIdea["priority"][];
  campaigns: number[];
}

// Brief filters
export interface BriefFilters {
  search: string;
  statuses: ContentBrief["status"][];
  campaigns: number[];
}

// Default filters
export const DEFAULT_IDEA_FILTERS: IdeaFilters = {
  search: "",
  statuses: [],
  priorities: [],
  campaigns: [],
};

export const DEFAULT_BRIEF_FILTERS: BriefFilters = {
  search: "",
  statuses: [],
  campaigns: [],
};
