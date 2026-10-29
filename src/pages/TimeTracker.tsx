
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRight, PictureInPicture2 } from "lucide-react";

export default function TimeTracker() {
  const tasks = [
    { id: 1, description: 'Тест -##Тестовий Заклад №0 18:30 (з 20 хв)' },
    { id: 2, description: 'ТЕст -##Тестовий Заклад №0 17:20 (з 20 хв)' },
    { id: 3, description: 'ТЕст -##Тестовий Заклад №0 19:20 (з 30 хв)' },
    { id: 4, description: 'Тест -##Тестовий Заклад №0 16:57 (з 20 хв)' },
    { id: 5, description: 'Тест0 -##Тестовий Заклад №0 18:43 (з 20 хв)' },
    { id: 6, description: 'Тест h -##Тестовий Заклад №0 18:31 (з 20 хв)' },
  ];

  const handlePipToggle = () => {
    if ((window as any).__interactiveTabPiP) {
      (window as any).__interactiveTabPiP.toggle({
        mode: 'element-only',
        targetSelector: '.task-section',
      });
    } else {
      console.log("PiP API not available");
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="task-section">
        <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <h2 className="text-2xl font-bold text-foreground">Завдання</h2>
            <div className="flex items-center space-x-2">
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

          <h3 className="text-lg font-semibold text-center my-4 text-foreground">В особистому пулі:</h3>
          
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border transition-colors hover:bg-muted/60 cursor-pointer">
                  <div className="flex items-center space-x-3">
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-gray-600/50 hover:bg-gray-600/80">
                          <RefreshCw className="h-4 w-4 text-white" />
                      </Button>
                      <div className="bg-red-500/10 border border-red-500/50 rounded-md px-2 py-1">
                          <span className="text-red-400 text-xs font-bold">Час вийшов!</span>
                      </div>
                      <span className="text-foreground text-sm">{task.description}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
