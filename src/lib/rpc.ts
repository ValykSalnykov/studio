const REST_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function rpc<T>(name: string, payload: unknown): Promise<T> {
const res = await fetch(`${REST_URL}/rpc/${name}`, {
method: 'POST',
headers: {
'apikey': ANON_KEY,
'Authorization': `Bearer ${ANON_KEY}`,
'Content-Type': 'application/json',
'Prefer': 'params=single-object'
},
body: JSON.stringify(payload ?? {})
});
if (!res.ok) {
const text = await res.text();
throw new Error(`RPC ${name} failed: ${res.status} ${text}`);
}
return res.json() as Promise<T>;
}

export const api = {
listRecords: (args: {
search?: string | null;
archived?: boolean | null;       // null | true | false
withDupesOnly?: boolean;
limit?: number;
offset?: number;
}) => rpc<Array<{
id: number;
content: string | null;
archived: boolean;
canonical_id: number | null;
duplicates_count: number;
has_duplicates: boolean;
}>>('get_telegrambad_backup_page', {
p_search: args.search ?? null,
p_archived: args.archived ?? null,
p_with_dupes_only: !!args.withDupesOnly,
p_limit: Number(args.limit ?? 20),
p_offset: Number(args.offset ?? 0)
}),

getCluster: (id: number) =>
rpc<Array<{
id: number;
role: 'canonical' | 'self' | 'duplicate';
archived: boolean;
canonical_id: number | null;
sim: number | null;
content: string | null;
}>>('get_record_cluster_backup', { p_id: id }),

sendOk: (args: {
id: number;
archiveSource?: boolean;      // default true
allowArchived?: boolean;      // default false
metadataExtra?: Record<string, unknown>; // {}
dedupeByContent?: boolean;    // false
}) => rpc<Array<{ telegram_id: number; archived: boolean }>>('send_to_telegram_backup', {
p_id: args.id,
p_archive_source: args.archiveSource ?? true,
p_allow_archived: args.allowArchived ?? false,
p_metadata_extra: args.metadataExtra ?? {},
p_dedupe_by_content: args.dedupeByContent ?? false
}),

setNotOk: (id: number, reason: string = 'manual') =>
rpc<boolean>('archive_backup_record', { p_id: id, p_reason: reason }),

editRecord: (args: { id: number; newContent: string; metadataPatch?: Record<string, unknown> | null }) =>
rpc<boolean>('edit_backup_content', {
p_id: args.id,
p_new_content: args.newContent,
p_new_embedding: null,
p_metadata_patch: args.metadataPatch ?? null
})
};

export type Api = typeof api;