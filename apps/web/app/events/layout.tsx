import { Navbar } from "@/components/ui/Navbar";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto py-6 px-4 flex-1">{children}</main>
    </>
  );
}
