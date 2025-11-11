'use client';

import { supabase } from '@/lib/supabase';

async function rpc<T>(name: string, params: any) {
const { data, error } = await supabase.rpc(name, params);
if (error) {
console.error('RPC error', name, params, error);
const message = String(error.message ?? 'Unknown error');
// alert('Supabase RPC error: ' + message); // слишком спамно
throw new Error(message);
}
return data as T;
}

/**
* API нашего приложения. Это обёртка над rpc-вызовами Supabase.
* Именно этот объект нужно использовать в коде, чтобы общаться с бекендом.
*/
export const api = {
  listRecords: (args: {
    search?: string | null;
    archived?: boolean | null;
    withDupesOnly?: boolean;
    limit?: number;
    offset?: number;
    pairsThr?: number;
  }) => rpc<Array<{ // ...
    id: number;
    content: string | null;
    archived: boolean;
    canonical_id: number | null;
    duplicates_count: number;
    has_duplicates: boolean;
  }>>('get_telegrambad_backup_page_pairs', {
    p_search: args.search ?? null,
    p_archived: args.archived ?? null,
    p_with_dupes_only: !!args.withDupesOnly,
    p_limit: Number(args.limit ?? 20),
    p_offset: Number(args.offset ?? 0),
    p_pairs_thr: Number(args.pairsThr ?? 0.86)
  }),

  getCluster: (id: number) =>
    rpc<Array<{ // ...
      id: number; role: 'canonical' | 'self' | 'duplicate';
      archived: boolean; canonical_id: number | null; sim: number | null; content: string | null;
    }>>('get_record_cluster_backup', { p_id: id }),

  getSimilarPairs: (args: { id: number; thr?: number; limit?: number; offset?: number }) =>
    rpc<Array<{ // ...
      neighbor_id: number;
      sim: number;
      neighbor_archived: boolean;
      neighbor_canonical_id: number | null;
      neighbor_content: string | null;
    }>>('get_record_similar_pairs_backup', {
      p_id: args.id,
      p_thr: Number(args.thr ?? 0.86),
      p_limit: Number(args.limit ?? 50),
      p_offset: Number(args.offset ?? 0)
    }),

  sendOk: (args: {
    id: number;
    archiveSource: boolean;
    allowArchived: boolean;
    metadataExtra: object;
    dedupeByContent: boolean;
  }) => rpc<Array<{ id: number, telegram_id: number }>>('send_to_telegram_backup', {
    p_id: args.id,
    p_archive_source: args.archiveSource,
    p_allow_archived: args.allowArchived,
    p_metadata_extra: args.metadataExtra,
    p_dedupe_by_content: args.dedupeByContent
  }),

  setNotOk: (id: number, reason: string) =>
    rpc('archive_backup_record', { p_id: id, p_reason: reason }),

  editRecord: (args: { id: number; newContent: string; metadataPatch: object }) =>
    rpc('edit_backup_content', { p_id: args.id, p_new_content: args.newContent, p_metadata_patch: args.metadataPatch })
};