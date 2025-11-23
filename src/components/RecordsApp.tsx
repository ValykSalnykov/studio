
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/rpc';
import RecordModal from './RecordModal';

type Row = Awaited<ReturnType<typeof api.listRecords>>[number];

export default function RecordsApp() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<string>('');
  const [archived, setArchived] = useState<null | boolean>(false); // по умолчанию активные
  const [withDupesOnly, setWithDupesOnly] = useState(false);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);

  const query = useMemo(() => ({
    search: search.trim() || null,
    archived,
    withDupesOnly,
    limit,
    offset,
  }), [search, archived, withDupesOnly, limit, offset]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listRecords(query);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [query]); // перезагрузка при изменении фильтров

  function afterActionRefresh() {
    // обновить текущую страницу после действий из модалки
    load();
  }

  return (
    <div className="bg-gray-900 text-white p-4">
      <div className="flex gap-4 mb-4 items-center">
        <input
          placeholder="Поиск по content"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 w-1/3"
        />
        <select
          value={archived === null ? 'all' : archived ? 'archived' : 'active'}
          onChange={(e) => {
            setOffset(0);
            setArchived(e.target.value === 'all' ? null : e.target.value === 'archived');
          }}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
        >
          <option value="active">Активные</option>
          <option value="archived">Архив</option>
          <option value="all">Все</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={withDupesOnly} onChange={(e) => { setWithDupesOnly(e.target.checked); setOffset(0); }} />
          Только с дублями
        </label>
        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }} className="bg-gray-800 border border-gray-700 rounded px-3 py-2">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {loading ? <div className="text-center py-4">Загрузка…</div> : rows.length === 0 ? <div className="text-center py-4">Ничего не найдено</div> : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-3">ID</th>
              <th className="p-3">Snippet</th>
              <th className="p-3">Дубли</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="p-3">{r.id}</td>
                <td className="p-3 max-w-lg truncate" title={r.content ?? ''}>
                  {r.content}
                </td>
                <td className="p-3">
                  {r.has_duplicates ? `есть (${r.duplicates_count})` : '—'}
                </td>
                <td className="p-3">{r.archived ? 'архив' : 'активна'}</td>
                <td className="p-3">
                  <button onClick={() => setOpenId(r.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Открыть</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 flex gap-4">
        <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Назад</button>
        <button onClick={() => setOffset(offset + limit)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Вперёд</button>
      </div>

      {openId !== null && (
        <RecordModal
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={afterActionRefresh}
        />
      )}
    </div>
  );
}
