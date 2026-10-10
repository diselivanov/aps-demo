import TableSettings from "./TableSettings";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TableSettingsPage({ params }: Props) {
  const { id } = await params;
  return <TableSettings tableId={Number(id)} />;
}
