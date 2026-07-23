import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/logout/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            You&apos;re logged in
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full border border-zinc-300 px-5 py-3 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
