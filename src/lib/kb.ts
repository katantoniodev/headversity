export type KbSourceType = "manual" | "transcript" | "slack_paste";

export type KbEntry = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  source_type: KbSourceType;
  source_ref: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};
