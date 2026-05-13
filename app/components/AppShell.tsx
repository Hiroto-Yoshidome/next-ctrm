import Sidebar from "./Sidebar";
import TabBar from "./TabBar";
import TabContent from "./TabContent";
import { auth, signOut } from "@/auth";

export default async function AppShell() {
  const session = await auth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-11 bg-white border-b border-gray-200 flex items-center justify-end px-5 shrink-0">
          <span className="text-sm text-gray-500 mr-4">{session?.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ログアウト
            </button>
          </form>
        </header>
        <TabBar />
        <TabContent />
      </div>
    </div>
  );
}
