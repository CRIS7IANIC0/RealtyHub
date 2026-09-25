import PropertyDetailClient from "./PropertyDetailClient";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  return <PropertyDetailClient propertyId={resolvedParams.id} />;
}
