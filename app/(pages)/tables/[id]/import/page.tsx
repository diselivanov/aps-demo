import ImportWizard from "./ImportWizard";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ImportPage({ params }: Props) {
  const { id } = await params;
  return <ImportWizard tableId={Number(id)} />;
}
