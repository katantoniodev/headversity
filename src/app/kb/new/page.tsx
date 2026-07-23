import AppHeader from "@/components/AppHeader";
import KbEntryForm from "@/components/KbEntryForm";

export default function NewKbEntryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-4 text-lg font-semibold text-gray-900">
          New knowledge base entry
        </h1>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <KbEntryForm />
        </div>
      </main>
    </div>
  );
}
