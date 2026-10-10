import TableGrid from "./TableGrid";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TablePage({ params }: Props) {
  const { id } = await params;
  return <TableGrid tableId={Number(id)} />;
}
