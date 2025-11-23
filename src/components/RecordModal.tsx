
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/rpc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type NeighborItem = Awaited<ReturnType<typeof api.getSimilarPairs>>[number];

interface RecordModalViewProps {
  id: number;
  onChanged: () => void;
  onClose: () => void;
  depth: number;
  setModalContent: (c: React.ReactNode) => void;
}

// Parser and formatter functions remain the same
const parseContent = (content: string | null | undefined) => {
  if (!content) return { theme: '', question: '', answer: '' };
  const keywords = ["Тема:", "Вопрос:", "Ответ:"];
  const parts: { [key: string]: string } = { theme: '', question: '', answer: '' };
  const keyMap: { [key: string]: string } = { "Тема:": "theme", "Вопрос:": "question", "Ответ:": "answer" };
  const foundKeywords = keywords.map(k => ({ keyword: k, index: content.indexOf(k) })).filter(item => item.index !== -1).sort((a, b) => a.index - b.index);
  if (foundKeywords.length === 0) {
    return { theme: '', question: '', answer: content.trim() };
  }
  for (let i = 0; i < foundKeywords.length; i++) {
    const current = foundKeywords[i];
    const next = foundKeywords[i + 1];
    const start = current.index + current.keyword.length;
    const end = next ? next.index : content.length;
    const text = content.substring(start, end).trim().replace(/;$/, '').trim();
    const fieldName = keyMap[current.keyword];
    if (fieldName) parts[fieldName] = text;
  }
  return parts;
};

const formatContent = (theme: string, question: string, answer: string) => {
  const parts = [];
  if (theme) parts.push(`Тема: ${theme}`);
  if (question) parts.push(`Вопрос: ${question}`);
  if (answer) parts.push(`Ответ: ${answer}`);
  return parts.join('; ') + (parts.length > 0 ? ';' : '');
};

const RecordModalView: React.FC<RecordModalViewProps> = (props) => {
  const { id, onChanged, onClose, depth, setModalContent } = props;
  const [neighbors, setNeighbors] = useState<NeighborItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [theme, setTheme] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [originalState, setOriginalState] = useState({ theme: '', question: '', answer: '' });

  const [confirmingDuplicate, setConfirmingDuplicate] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const [recordData, similarData] = await Promise.all([
        api.getCluster(id).then(res => res?.[0]),
        api.getSimilarPairs({ id })
      ]);
      const parsed = parseContent(recordData?.content);
      setTheme(parsed.theme);
      setQuestion(parsed.question);
      setAnswer(parsed.answer);
      setOriginalState({ theme: parsed.theme, question: parsed.question, answer: parsed.answer });
      setNeighbors(similarData);
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    setBusy(true); setError(null); setSuccessMessage(null);
    try {
        const newContent = formatContent(theme, question, answer);
        await api.editRecord({ id, newContent, metadataPatch: { edited: true } });
        setSuccessMessage('Сохранено');
        setEditing(false);
        setOriginalState({ theme, question, answer });
        onChanged();
    } catch (e: any) {
        setError(String(e.message ?? e));
    } finally {
        setBusy(false);
    }
  }

  function handleCancelEdit() {
      setEditing(false);
      setTheme(originalState.theme);
      setQuestion(originalState.question);
      setAnswer(originalState.answer);
  }

  async function handleSendOk() {
      setBusy(true); setError(null); setSuccessMessage(null);
      try {
          const res = await api.sendOk({ id, archiveSource: true, allowArchived: false, metadataExtra: {}, dedupeByContent: false });
          setSuccessMessage(`Отправлено в telegram (id=${res?.[0]?.telegram_id ?? '—'})`);
          onChanged();
          setTimeout(onClose, 1000);
      } catch (e: any) {
          setError(String(e.message ?? e));
      } finally {
          setBusy(false);
      }
  }

  async function handleNotOk() {
      setBusy(true); setError(null); setSuccessMessage(null);
      try {
          await api.setNotOk(id, 'manual');
          setSuccessMessage('Запись заархивирована');
          onChanged();
          setTimeout(onClose, 1000);
      } catch (e: any) {
          setError(String(e.message ?? e));
      } finally {
          setBusy(false);
      }
  }

  function openNeighbor(neighborId: number) {
    if (depth > 5) {
        setError("Достигнута максимальная глубина вложенности модальных окон.");
        return;
    }
    setModalContent(<RecordModalView id={neighborId} onChanged={onChanged} onClose={onClose} depth={depth + 1} setModalContent={setModalContent} />);
  }

  async function executeSetDuplicate(duplicateId: number) {
    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.setCanonical({ duplicateId, canonicalId: id });
      setSuccessMessage(`Кейс #${duplicateId} успешно помечен как дубль.`);
      const similarData = await api.getSimilarPairs({ id });
      setNeighbors(similarData);
      onChanged();
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(false);
      setConfirmingDuplicate(null);
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Запись #{id}</h3>
      </div>

      {error && <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded relative mb-4">{error}</div>}
      {successMessage && <div className="bg-green-900 border border-green-700 text-white px-4 py-3 rounded relative mb-4">{successMessage}</div>}
      
      {loading ? <div className="text-center py-4">Загрузка…</div> : (
        <>
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Тема</label>
              <textarea value={theme} readOnly={!editing} onChange={(e) => setTheme(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 min-h-[40px]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Вопрос</label>
              <textarea value={question} readOnly={!editing} onChange={(e) => setQuestion(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 min-h-[80px]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ответ</label>
              <textarea value={answer} readOnly={!editing} onChange={(e) => setAnswer(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 min-h-[150px]" />
            </div>
          </div>

          {!editing ? (
            <button onClick={() => setEditing(true)} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Редактировать</button>
          ) : (
            <div className="flex gap-2 mt-2">
              <button disabled={busy} onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Сохранить</button>
              <button disabled={busy} onClick={handleCancelEdit} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Отмена</button>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <h4 className="text-lg font-bold mb-2">Похожие по смыслу</h4>
            {(!neighbors || neighbors.length === 0) ? <p className="text-gray-400">Похожих записей не найдено.</p> : (
              <div className="space-y-3">
                {neighbors.map(n => (
                  <details key={n.neighbor_id} className="bg-gray-800 rounded-lg">
                    <summary className="p-3 cursor-pointer flex justify-between items-center">
                        <div className="font-medium">Кейс #{n.neighbor_id}</div>
                        <div className="text-sm text-gray-400 space-x-4">
                            <span>Сходство: {n.sim.toFixed(3)}</span>
                            <span>Статус: {n.neighbor_archived ? `Архив (канон: ${n.neighbor_canonical_id ?? '—'})` : 'Активен'}</span>
                        </div>
                    </summary>
                    <div className="p-4 border-t border-gray-700">
                      <pre className="text-sm whitespace-pre-wrap font-sans bg-gray-900 p-2 rounded">{n.neighbor_content}</pre>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => openNeighbor(n.neighbor_id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">Открыть</button>
                        {!n.neighbor_archived && (
                          <button disabled={busy} onClick={() => setConfirmingDuplicate(n.neighbor_id)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50">Сделать дублем кейса #{id}</button>
                        )}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
             <button disabled={busy} onClick={handleSendOk} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Ок (в telegram)</button>
             <button disabled={busy} onClick={handleNotOk} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">неОк (в архив)</button>
          </div>
        </>
      )}

      <AlertDialog open={confirmingDuplicate !== null} onOpenChange={() => setConfirmingDuplicate(null)}>
        <AlertDialogContent className="bg-gray-900 text-gray-50 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите действие</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Вы уверены, что хотите сделать кейс #{confirmingDuplicate} дублем для текущего кейса #{id}? Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-600 hover:bg-gray-700 border-0">Отмена</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => {if(confirmingDuplicate) executeSetDuplicate(confirmingDuplicate)}}>
              Продолжить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function RecordModal(props: { id: number; onClose: () => void; onChanged: () => void; }) {
    const { id, onClose, onChanged } = props;
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);

    useEffect(() => {
        setModalContent(<RecordModalView id={id} onChanged={onChanged} onClose={onClose} depth={1} setModalContent={setModalContent} />);
    }, [id, onChanged, onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-auto relative">
                <button onClick={props.onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                {modalContent}
            </div>
        </div>
    );
}
