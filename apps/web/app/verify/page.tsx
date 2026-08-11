import type { Metadata } from "next";
import { CertificateVerifier } from "@/features/participation";

export const metadata: Metadata = {
  title: "Verify Certificate | EventSphere",
  description: "Verify the authenticity of an EventSphere event certificate.",
};

export default function VerifyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CertificateVerifier />
    </div>
  );
}
