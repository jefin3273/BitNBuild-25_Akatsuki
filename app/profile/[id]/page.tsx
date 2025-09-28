import ProfilePage from "@/components/ProfilePage";

export default async function Home({ params }: any) {
  const { id } = await params;
  return (
    <>
      <ProfilePage id={id} />
    </>
  );
}
