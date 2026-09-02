import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell() {
  const location = useLocation();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex">
      <Sidebar />
      <div className="flex h-screen flex-1 flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50">
          <div key={location.pathname} className="page-enter min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
