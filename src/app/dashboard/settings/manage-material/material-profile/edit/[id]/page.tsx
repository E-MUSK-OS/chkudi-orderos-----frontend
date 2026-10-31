import AddMaterial from "@/components/Dashboard/Materials/ManageMaterials/AddMaterial";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  return (
    <AddMaterial
      materialId={resolvedParams.id}
      returnPath="/dashboard/settings/manage-material/material-profile"
    />
  );
}

