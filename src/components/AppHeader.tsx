import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-indigo-600">
          Workspace
        </span>
        <nav className="flex gap-4 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-indigo-600">
            Board
          </Link>
          <Link href="/kb" className="hover:text-indigo-600">
            Knowledge Base
          </Link>
          <Link href="/dashboard" className="hover:text-indigo-600">
            Dashboard
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="/api/export"
          className="text-sm font-medium text-gray-600 hover:text-indigo-600"
        >
          Export backup
        </a>
        <span className="text-sm text-gray-500">{user?.email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
