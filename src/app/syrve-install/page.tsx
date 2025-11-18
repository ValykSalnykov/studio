'use client';

import { Button } from "@/components/ui/button";
import { PictureInPicture2 } from 'lucide-react';

export default function SyrveInstallPage() {
  const installs = [
    {
      id: 1,
      domain: 'tatarka-cafe-4.daocloud.it',
      status: 'Office успішно',
      statusColor: 'text-green-400',
    },
    {
      id: 2,
      domain: 'belayapizza.daocloud.it',
      status: 'Chain в процесі',
      statusColor: 'text-yellow-400',
    },
    {
      id: 3,
      domain: 'fast-food-king.daocloud.it',
      status: 'Помилка встановлення',
      statusColor: 'text-red-400',
    },
  ];

  const handlePipToggle = () => {
    if ((window as any).__interactiveTabPiP) {
      (window as any).__interactiveTabPiP.toggle({
        mode: 'element-only',
        targetSelector: '.App .main-container .single-column',
      });
    } else {
      console.log("PiP API not available");
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="single-column">
          <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 mb-4 border-b border-border">
              <h2 className="text-2xl font-bold text-blue-400 mb-4 md:mb-0">
                Встановлення BackOffice / Chain
              </h2>
              <div className="flex items-center space-x-2">
                <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold">Поточні</Button>
                <Button variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-gray-300 font-semibold">Архів</Button>

                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 bg-blue-500 border-blue-400 hover:bg-blue-600"
                  onClick={handlePipToggle}
                  title="Toggle PiP"
                >
                  <PictureInPicture2 className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {installs.map((install) => (
                <div key={install.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center space-x-4 mb-2 md:mb-0">
                    <span className="font-mono text-sm text-foreground">{install.domain}</span>
                    <span className={`text-sm font-semibold ${install.statusColor}`}>{install.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">Детальніше</Button>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">Архів</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
