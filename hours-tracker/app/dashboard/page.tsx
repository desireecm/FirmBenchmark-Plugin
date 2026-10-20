import { auth, signOut } from "@/auth";

// Placeholder until Phase 4 builds the real dashboard.
export default async function DashboardPage() {
  const session = await auth();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button className="text-sm text-muted underline">Sign out</button>
        </form>
      </header>
      <p className="mt-4 text-muted">
        Signed in as {session?.user?.name} ({session?.user?.email})
        {session?.user?.isAdmin ? " · Admin" : ""}.
      </p>
      <p className="mt-2 text-muted">Retainer tracking arrives in Phase 4.</p>
    </main>
  );
}
