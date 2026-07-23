import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          That link didn&apos;t work
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The login link may have expired or already been used. Request a new
          one below.
        </p>
        <Link
          href="/login"
          className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
