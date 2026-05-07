import { listFacets } from "@/lib/queries";
import { PreferencesForm } from "@/components/PreferencesForm";

export const dynamic = "force-dynamic";

export default function PreferencesPage() {
  const facets = listFacets();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">My preferences</h1>
      <p className="text-ink-dim text-sm mt-1 max-w-prose">
        Stored locally on this device — no account required. The site uses these to
        explain why each game might or might not be for you.
      </p>
      <div className="mt-6">
        <PreferencesForm facets={facets} />
      </div>
    </div>
  );
}
