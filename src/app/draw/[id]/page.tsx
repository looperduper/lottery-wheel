import DrawRoom from '@/components/DrawRoom'

export default async function DrawPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DrawRoom id={id} />
}
