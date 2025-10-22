import { supabase } from '@/lib/supabase';

async function getTelegramCheckData() {
  const { data, error } = await supabase.from('telegramcheck').select('id, content');
  if (error) {
    console.error('Error fetching data from Supabase:', error);
    return [];
  }
  return data;
}

export default async function RabochiePage() {
  const data = await getTelegramCheckData();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Рабочие</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Content</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="py-2 px-4 border-b">{item.id}</td>
                <td className="py-2 px-4 border-b">{item.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
