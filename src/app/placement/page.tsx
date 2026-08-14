import { PlacementRunner } from "@/components/placement/PlacementRunner";
import { getPlacementVocabPools } from "@/server/placement-queries";

export default async function PlacementPage() {
  const pools = await getPlacementVocabPools();

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background">
      <PlacementRunner pools={pools} />
    </div>
  );
}
