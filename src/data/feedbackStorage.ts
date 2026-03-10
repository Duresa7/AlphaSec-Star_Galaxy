import { supabase, supabaseConfigured } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export type FeedbackCategory = 'feature_request' | 'bug' | 'other';

export interface FeedbackEntry {
  id: string;
  user_id: string | null;
  display_name: string;
  category: FeedbackCategory;
  other_label: string | null;
  message: string;
  created_at: string;
}

export interface FeedbackInput {
  category: FeedbackCategory;
  other_label?: string;
  message: string;
}

export async function fetchFeedback(): Promise<FeedbackEntry[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    logger.error('Failed to fetch feedback:', error);
    return [];
  }
  return data as FeedbackEntry[];
}

export async function insertFeedback(input: FeedbackInput): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('feedback').insert(input);
  if (error) {
    logger.error('Failed to insert feedback:', error);
    throw error;
  }
}

export async function deleteFeedback(id: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) {
    logger.error('Failed to delete feedback:', error);
    throw error;
  }
}
