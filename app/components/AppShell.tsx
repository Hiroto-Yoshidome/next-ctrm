import Sidebar from "./Sidebar";
import { auth, signOut } from "@/auth";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <span className="text-sm text-gray-500 mr-4">{session?.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
