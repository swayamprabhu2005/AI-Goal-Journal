import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">

      <Navbar />

      <div className="flex flex-1">

        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}