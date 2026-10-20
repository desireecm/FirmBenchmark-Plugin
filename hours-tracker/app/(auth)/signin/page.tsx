import { signIn } from "@/auth";

const ERRORS: Record<string, string> = {
  AccessDenied:
    "That account isn't allowed. Sign in with your @esquireinteractive.com account, or ask an admin to add you.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-xl font-semibold">EI Hours Tracker</h1>
        <p className="mt-1 text-sm text-muted">Sign in with your Microsoft 365 account.</p>
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-border p-3 text-sm">
            {ERRORS[error] ?? "Sign-in failed. Please try again."}
          </p>
        )}
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: callbackUrl ?? "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white dark:text-black"
          >
            Sign in with Microsoft
          </button>
        </form>
      </div>
    </main>
  );
}
