import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Communities | EventSphere",
  description: "Browse and discover campus communities on EventSphere, or manage your own.",
};

export default function CommunitiesLayout({
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
