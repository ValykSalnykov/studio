'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/rpc';

type ClusterItem = Awaited<ReturnType<typeof api.getCluster>>[number];

export default function RecordModal(props: { id: number; onClose: () => void; onChanged: () => void; }) {
const { id, onClose, onChanged } = props;
const [items, setItems] = useState<ClusterItem[] | null>(null);
const [loading, setLoading] = useState(false);
const [content, setContent] = useState<string>('');
const [editing, setEditing] = useState(false);
const [busy, setBusy] = useState(false);
const [error, setError] = useState<string | null>(null);

async function load() {
setLoading(true);
setError(null);
try {
const data = await api.getCluster(id);
setItems(data);
const self = data.find(x => x.id === id) ?? data[0];
setContent(self?.content ?? '');
} catch (e: any) {
setError(String(e.message ?? e));
} finally {
setLoading(false);
}
}

useEffect(() => { load(); }, [id]);

async function handleSendOk() {
setBusy(true); setError(null);
try {
const res = await api.sendOk({ id, archiveSource: true, allowArchived: false, metadataExtra: {}, dedupeByContent: false });
// res — массив из одного элемента
alert(`Отправлено в telegram (id=${res?.[0]?.telegram_id ?? '—'})`);
await load();
onChanged();
} catch (e: any) {
setError(String(e.message ?? e));
} finally {
setBusy(false);
}
}

async function handleNotOk() {
setBusy(true); setError(null);
try {
await api.setNotOk(id, 'manual');
alert('Запись заархивирована');
await load();
onChanged();
} catch (e: any) {
setError(String(e.message ?? e));
} finally {
setBusy(false);
}
}

async function handleSave() {
setBusy(true); setError(null);
try {
await api.editRecord({ id, newContent: content, metadataPatch: { edited: true } });
alert('Сохранено');
setEditing(false);
await load();
onChanged();
} catch (e: any) { 
setError(String(e.message ?? e));
} finally {
setBusy(false);
}
}

return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">Запись #{id}</h3>
<button onClick={onClose} className="text-gray-400 hover:text-white">Закрыть</button>
</div>

    {error && <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded relative mb-4">{error}</div>}
    {loading || !items ? <div className="text-center py-4">Загрузка…</div> : (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Текст</label>
          <textarea
            value={content}
            readOnly={!editing}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 min-h-[140px]"
          />
          {!editing ? (
            <button onClick={() => setEditing(true)} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Редактировать</button>
          ) : (
            <div className="flex gap-2 mt-2">
              <button disabled={busy} onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Сохранить</button>
              <button disabled={busy} onClick={() => { setEditing(false); load(); }} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Отмена</button>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-bold mb-2">Связанные</h4>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3">ID</th>
                <th className="p-3">Роль</th>
                <th className="p-3">sim</th>
                <th className="p-3">archived</th>
                <th className="p-3">canonical_id</th>
                <th className="p-3">Snippet</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-b border-gray-800 hover:bg-gray-700">
                  <td className="p-3">{it.id}</td>
                  <td className="p-3">{it.role}</td>
                  <td className="p-3">{it.sim === null ? '—' : it.sim.toFixed(3)}</td>
                  <td className="p-3">{String(it.archived)}</td>
                  <td className="p-3">{it.canonical_id ?? '—'}</td>
                  <td className="p-3 max-w-md truncate" title={it.content ?? ''}>{it.content}</td>
                  <td className="p-3">
                    <button onClick={() => {
                      // открыть другую запись в этой же модалке
                      window.history.pushState({}, '', `#${it.id}`);
                      // хак: перезагрузим по id
                      // лучше передать через внешний стейт, но для простоты:
                      location.hash = String(it.id);
                    }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Открыть</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mt-6">
          <button disabled={busy} onClick={handleSendOk} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Ок (в telegram)</button>
          <button disabled={busy} onClick={handleNotOk} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">неОк (в архив)</button>
        </div>
      </>
    )}
  </div>
</div>
);
}
