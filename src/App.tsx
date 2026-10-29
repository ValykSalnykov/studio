import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from '@/components/navigation';
import { cn } from '@/lib/utils';
import Home from '@/pages/Home';
import AiMentor from '@/pages/AiMentor';
import Templator from '@/pages/Templator';
import DeepSearch from '@/pages/DeepSearch';
import SyrveInstall from '@/pages/SyrveInstall';
import TimeTracker from '@/pages/TimeTracker';
import CasesUnprocessed from '@/pages/cases/CasesUnprocessed';
import CasesWorking from '@/pages/cases/CasesWorking';
import CasesComplex from '@/pages/cases/CasesComplex';
import CasesPending from '@/pages/cases/CasesPending';

function App() {
  const location = useLocation();
  const pathname = location.pathname;
  const isHomePage = pathname === '/';
  const isAiMentorPage = pathname === '/ai-mentor';

  return (
    <div className="font-body antialiased bg-gray-900 text-white">
      <div className="flex flex-col h-screen">
        <Navigation />
        <main className={cn("flex-1 overflow-y-auto", {
          "p-0": isHomePage || isAiMentorPage,
          "p-6": !isHomePage && !isAiMentorPage
        })}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai-mentor" element={<AiMentor />} />
            <Route path="/templator" element={<Templator />} />
            <Route path="/deep-search" element={<DeepSearch />} />
            <Route path="/syrve-install" element={<SyrveInstall />} />
            <Route path="/time-tracker" element={<TimeTracker />} />
            <Route path="/cases/unprocessed" element={<CasesUnprocessed />} />
            <Route path="/cases/working" element={<CasesWorking />} />
            <Route path="/cases/complex" element={<CasesComplex />} />
            <Route path="/cases/pending" element={<CasesPending />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
