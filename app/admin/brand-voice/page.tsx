import { listVersions } from "@/lib/admin/brand-voice-store";
import { BrandVoiceEditor } from "./BrandVoiceEditor";

export const dynamic = "force-dynamic";

export default async function BrandVoicePage() {
  const versions = await listVersions();
  const active = versions.find((v) => v.is_active) ?? versions[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Brand Voice / System Prompt</h1>
        <p className="mt-1 text-sm text-gray-500">
          Edit the system prompt that shapes every draft. Each save creates a new immutable
          version — you can restore any previous version at any time.
        </p>
      </div>

      <BrandVoiceEditor activeContent={active?.content ?? ""} versions={versions} />
    </div>
  );
}
