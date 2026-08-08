"use client";

import { useState } from "react";
import { verifyCertificate } from "../api/participationClient";
import type { CertificateResponse } from "../types";
import { FadeIn } from "@/components/motion/FadeIn";

export function CertificateVerifier() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CertificateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const response = await verifyCertificate(code.trim());
    if (response.ok) {
      setResult(response.data);
    } else {
      setError("Certificate not found or invalid code.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold">Verify Certificate</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter verification code"
          maxLength={12}
          className="flex-1 px-3 py-2 border rounded-md font-mono tracking-widest text-center"
        />
        <button
          onClick={handleVerify}
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {result && (
        <FadeIn>
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-2xl">&#10003;</span>
              <span className="font-semibold">Certificate Valid</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Status: {result.status}
              {result.issuedAt && <> &middot; Issued: {new Date(result.issuedAt).toLocaleDateString()}</>}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Code: {result.verificationCode}
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
