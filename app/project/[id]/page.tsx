import Project from "@/components/Project";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  return <Project id={id} />;
}
