import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, Unlock, Database, Code, RefreshCw } from 'lucide-react';

interface PlainAndTokenPair {
  field: string;
  plainValue: string;
  tokenValue: string;
  popiaBasis: string;
  sdxTag: string;
}

const POPIA_COLUMNS: PlainAndTokenPair[] = [
  {
    field: "Discovery Member ID",
    plainValue: "DI-9011-01",
    tokenValue: "member_token_a3b2c1598fe",
    popiaBasis: "Section 13 (Contract Necessity)",
    sdxTag: "POPIA_PERSONAL_IDENTIFIER"
  },
  {
    field: "Patient Date of Birth",
    plainValue: "1972-06-12 (Sipho Dlamini)",
    tokenValue: "age_band: [50-55] (Plain DOB dropped)",
    popiaBasis: "Section 37(1)(b) (Treatment Management)",
    sdxTag: "POPIA_DEIDENTIFIED"
  },
  {
    field: "RSA Identity Number",
    plainValue: "720612 5091 083",
    tokenValue: "sha256_id_hash: 5f4dcc3b5aa765d61",
    popiaBasis: "Section 13 Contract Necessity",
    sdxTag: "POPIA_PERSONAL_IDENTIFIER"
  },
  {
    field: "Chronic Diagnostics",
    plainValue: "Primary Hypertension (ICD10: I10)",
    tokenValue: "special_category_cdl_04",
    popiaBasis: "Section 26 (Special Health Consent Required)",
    sdxTag: "POPIA_SPECIAL_PERSONAL"
  },
  {
    field: "Provider GP Name / Practice No",
    plainValue: "Dr. S. Naidoo (Practice 0439201)",
    tokenValue: "provider_token_0439201_aes",
    popiaBasis: "Section 13 (Contract Necessity)",
    sdxTag: "POPIA_PERSONAL_IDENTIFIER"
  },
  {
    field: "Claim Billing Expense (ZAR)",
    plainValue: "R 1,850.00",
    tokenValue: "gross_claim_amount: 1850.00",
    popiaBasis: "Section 13 (Financial Admin Exception)",
    sdxTag: "FINANCIAL"
  }
];

export default function PopiaLineageTracker() {
  const [decrypted, setDecrypted] = useState(false);
  const [logTrace, setLogTrace] = useState<string[]>([]);

  const handleToggleDecrypt = () => {
    if (!decrypted) {
      setDecrypted(true);
      const newTrace = [
        `[${new Date().toLocaleTimeString()}] API Gateway: Mutual TLS (mTLS) session established with authorization clearance.`,
        `[${new Date().toLocaleTimeString()}] Token Vault HSM-backed lookup initiated for 5 active keys.`,
        `[${new Date().toLocaleTimeString()}] POPIA Consent Scope verified in SAP member master: YES (Opt-in active).`,
        `[${new Date().toLocaleTimeString()}] Re-identification logged successfully in Cloudera SDX Atlas.`
      ];
      setLogTrace(newTrace);
    } else {
      setDecrypted(false);
      setLogTrace([]);
    }
  };

  return (
    <div className="border border-white/10 bg-[#121212] p-6 space-y-6" id="popia-tracker-container">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-1">POPIA / CMS Compliance boundary</div>
          <h2 className="text-xl font-black font-display text-white uppercase flex items-center gap-2">
            Cloudera SDX Atlas Data Lineage & Token Vault
          </h2>
        </div>
        <button
          onClick={handleToggleDecrypt}
          className={`px-3 py-1.5 border uppercase text-[9px] font-black tracking-widest flex items-center gap-1.5 transition-all ${
            decrypted ? 'border-red-500 bg-red-950/10 text-red-500' : 'border-flywheel bg-flywheel/5 text-flywheel hover:bg-flywheel hover:text-black'
          }`}
        >
          {decrypted ? <Lock size={10} /> : <Unlock size={10} />} {decrypted ? "Re-tokenize PII" : "Authorized De-Tokenize"}
        </button>
      </div>

      <p className="text-xs text-white/50 leading-relaxed">
        Discovery Health protects member privacy by tokenizing all Personal Identifiable Information (PII) at the ingestion boundary. De-tokenization happens strictly at the API Gateway under authorized session scopes.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Comparison Table */}
        <div className="lg:col-span-8 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase text-white/40 font-mono tracking-wider">
                <th className="py-2.5">Functional Attribute</th>
                <th className="py-2.5">Cloudera Database (Ingested token)</th>
                <th className="py-2.5">Authorized API Gateway View</th>
                <th className="py-2.5">SDX Atlas Tag</th>
              </tr>
            </thead>
            <tbody>
              {POPIA_COLUMNS.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/2 font-mono text-[11px]">
                  <td className="py-3 font-sans font-bold text-white/80">{item.field}</td>
                  <td className="py-3 text-white/40 break-all select-all font-mono font-black">{item.tokenValue}</td>
                  <td className="py-3">
                    {decrypted ? (
                      <span className="text-flywheel bg-flywheel/10 px-1.5 py-0.5 border border-flywheel/20 font-black">{item.plainValue}</span>
                    ) : (
                      <span className="text-[#00E0FF] block">
                        <Lock size={8} className="inline mr-1" /> tokenized
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-[9px]">
                    <span className="bg-white/5 text-white/60 px-1.5 py-0.5 border border-white/10 font-bold uppercase">{item.sdxTag}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Log Panel - Right */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 border border-white/5 bg-black/40 h-full flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Database size={10} /> Active Decryption Audit Logs
              </div>
              
              {logTrace.length === 0 ? (
                <div className="text-[10px] font-mono text-white/30 italic py-6 text-center">
                  Verify authorization key above to inspect de-tokenization lineage trace...
                </div>
              ) : (
                <div className="space-y-2.5 font-mono text-[9px] text-[#00E0FF] leading-snug">
                  {logTrace.map((trace, i) => (
                    <div key={i} className="border-l-2 border-[#00E0FF] pl-2">
                      {trace}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 text-[9px] text-white/40 font-mono uppercase space-y-1">
              <div>checksum: <strong className="text-white">SHA256_TAMPER_EVIDENCE_OK</strong></div>
              <div>lineage: <strong className="text-white">Ingest_SAP_OData → Kafka → cloudera.iceberg</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
