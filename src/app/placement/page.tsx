import { PlacementRunner } from "@/components/placement/PlacementRunner";
import { getPlacementVocabPools } from "@/server/placement-queries";

// Not strictly reading mutable user-state, but forced dynamic for consistency with every other
// route in the app (see the (app) layout's note) so `npm run build && npm start` never surprises.
export const dynamic = "force-dynamic";

export default async function PlacementPage() {
  const pools = await getPlacementVocabPools();

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background">
      <PlacementRunner pools={pools} />
    </div>
  );
}
