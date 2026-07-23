export type ParentType = "task" | "kb_entry";

export type Comment = {
  id: string;
  user_id: string;
  parent_type: ParentType;
  parent_id: string;
  body: string;
  created_at: string;
};

export type Attachment = {
  id: string;
  user_id: string;
  parent_type: ParentType;
  parent_id: string;
  file_name: string;
  storage_path: string;
  size_bytes: number | null;
  created_at: string;
};
