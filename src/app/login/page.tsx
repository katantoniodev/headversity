import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Sign in
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a login link.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
