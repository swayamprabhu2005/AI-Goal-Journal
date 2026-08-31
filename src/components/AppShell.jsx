import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-text flex">
      {/* Static Fixed Sidebar */}
      <Sidebar />
      {/* Scrollable Right Content Column */}
      <div className="flex h-screen flex-1 flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}