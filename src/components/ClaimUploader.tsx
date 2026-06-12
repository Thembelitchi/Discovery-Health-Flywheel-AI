import React, { useState } from 'react';
import { PlusCircle, Activity, FileText, UploadCloud } from 'lucide-react';

interface Props {
  onUpload: (claimData: {
    memberId: string;
    providerPractice: string;
    totalClaimed: number;
    cptCode: string;
    icd10Code: string;
    serviceDate: string;
  }) => void;
}

const TEMPLATES = [
  {
    label: "GP Asthma Consult (Dr. Naidoo)",
    memberId: "DI-9044-04",
    providerPractice: "0439201",
    totalClaimed: 650,
    cptCode: "99213",
    icd10Code: "J45.9",
    desc: "Amina Patel (Asthma Consult) - Authorized rate"
  },
  {
    label: "Unregistered Clinic Consult (Fail V002)",
    memberId: "DI-9055-05",
    providerPractice: "0999999",
    totalClaimed: 1850,
    cptCode: "99214",
    icd10Code: "I10",
    desc: "Simulate out-of-network clinic to trigger manual audit review"
  },
  {
    label: "Diabetes Renal Panel (Pathcare)",
    memberId: "DI-9022-02",
    providerPractice: "0334812",
    totalClaimed: 820,
    cptCode: "82043",
    icd10Code: "E11.9",
    desc: "Sarah Lene kidney microalbumin urine check"
  }
];

export default function ClaimUploader({ onUpload }: Props) {
  const [memberId, setMemberId] = useState("DI-9022-02");
  const [providerPractice, setProviderPractice] = useState("0439201");
  const [totalClaimed, setTotalClaimed] = useState<number>(650);
  const [cptCode, setCptCode] = useState("99213");
  const [icd10Code, setIcd10Code] = useState("E11.9");
  const [serviceDate, setServiceDate] = useState("2026-06-12");

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanConfidence, setScanConfidence] = useState<number | null>(null);
  const [scanResultNotice, setScanResultNotice] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onUpload({
        memberId,
        providerPractice,
        totalClaimed,
        cptCode,
        icd10Code,
        serviceDate
      });
      setLoading(false);
    }, 600);
  };

  const applyTemplate = (tpl: typeof TEMPLATES[number]) => {
    setMemberId(tpl.memberId);
    setProviderPractice(tpl.providerPractice);
    setTotalClaimed(tpl.totalClaimed);
    setCptCode(tpl.cptCode);
    setIcd10Code(tpl.icd10Code);
    setServiceDate("2026-06-12");
    setScanConfidence(1.0);
    setScanResultNotice("Applied standard clinical archetype schema reference template.");
  };

  const processFile = (file: File) => {
    setScanning(true);
    setScanResultNotice("Executing Document AI claims parser...");
    setScanConfidence(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTimeout(() => {
        try {
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            if (parsed.memberId) setMemberId(parsed.memberId);
            else if (parsed.patient?.reference) setMemberId(parsed.patient.reference.replace("Patient/", ""));
            
            if (parsed.providerPractice) setProviderPractice(parsed.providerPractice);
            else if (parsed.provider?.reference) setProviderPractice(parsed.provider.reference.replace("Organization/", ""));
            
            if (parsed.totalClaimed) setTotalClaimed(Number(parsed.totalClaimed));
            else if (parsed.total?.value) setTotalClaimed(Number(parsed.total.value));
            
            if (parsed.cptCode) setCptCode(parsed.cptCode);
            if (parsed.icd10Code) setIcd10Code(parsed.icd10Code);
            if (parsed.serviceDate) setServiceDate(parsed.serviceDate);
            
            setScanConfidence(1.0);
            setScanResultNotice(`Direct FHIR/JSON document mapping verified and imported successfully: ${file.name}`);
          } else {
            // Semi-structured text parsing heuristics
            const memberMatch = text.match(/DI-\d{4}-\d{2}/i);
            const practiceMatch = text.match(/\b\d{7}\b/);
            const amtMatch = text.match(/(?:total|amount|charge|cost|r\s*)\s*[:=]?\s*(?:r|zar)?\s*(\d+(?:\.\d{2})?)/i);
            const cptMatch = text.match(/\b(82043|83036|99213|99214|93000|94010)\b/) || text.match(/\b\d{5}\b/);
            const icdMatch = text.match(/\b([a-z]\d{2}(?:\.\d)?)\b/i);

            let matchesCount = 0;

            if (memberMatch) {
              setMemberId(memberMatch[0].toUpperCase());
              matchesCount++;
            }
            if (practiceMatch) {
              setProviderPractice(practiceMatch[0]);
              matchesCount++;
            }
            if (amtMatch) {
              setTotalClaimed(parseFloat(amtMatch[1]));
              matchesCount++;
            }
            if (cptMatch && cptMatch[0] !== practiceMatch?.[0]?.substring(0, 5)) {
              setCptCode(cptMatch[0]);
              matchesCount++;
            }
            if (icdMatch) {
              setIcd10Code(icdMatch[0].toUpperCase());
              matchesCount++;
            }

            const confidence = matchesCount > 0 ? Number((0.6 + (matchesCount * 0.08)).toFixed(2)) : 0.45;
            setScanConfidence(Math.min(confidence, 0.96));
            setScanResultNotice(`Extracted ${matchesCount} key clinical elements from unstructured document: ${file.name}`);
          }
        } catch (err) {
          setScanConfidence(0.5);
          setScanResultNotice("Unstructured claims file uploaded. Extracted baseline text markers.");
        } finally {
          setScanning(false);
        }
      }, 1000);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 border border-white/10 bg-white/5 rounded-none h-full flex flex-col justify-between" id="claim-uploader-card">
      <div>
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-4 flex items-center gap-2">
          <Activity size={12} /> Claims Ingestion Intake
        </div>
        <p className="text-xs text-white/60 mb-6 leading-relaxed">
          Simulate Document AI scanning by submitting claims into the real-time Cloudera CDP processing queue. Or pick a clinical schema template below for rapid testing of business rules:
        </p>

        {/* Drag and Drop Zone */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed p-5 mb-6 text-center select-none transition-all ${
            dragActive ? 'border-flywheel bg-white/10' : 'border-white/10 bg-black/20 hover:border-white/20'
          }`}
          id="claim-drag-drop-zone"
        >
          <input 
            type="file" 
            id="claim-file-input" 
            onChange={handleFileChange} 
            accept=".json,.txt,.csv,.xml"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <UploadCloud size={24} className={dragActive ? 'text-flywheel animate-bounce' : 'text-white/40'} />
            <div className="text-[10px] font-black uppercase tracking-widest text-white">
              Upload claims invoice
            </div>
            <p className="text-[9px] text-white/40 uppercase">
              Drag & Drop FHIR/JSON representation or a receipt text file to auto-parse parameters
            </p>
          </div>
        </div>

        {/* Scan Status Feedback */}
        {(scanning || scanResultNotice) && (
          <div className="p-3.5 mb-6 bg-black border border-white/10 font-mono text-[9px] uppercase tracking-wider space-y-2">
            {scanning ? (
              <div className="flex items-center gap-2 text-flywheel animate-pulse">
                <SpinnerIcon />
                <span>Document AI is scanning schemas...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/40 font-bold">Extraction Confidence</span>
                  <span className={scanConfidence && scanConfidence > 0.8 ? 'text-flywheel' : 'text-yellow-400'}>
                    {scanConfidence ? `${Math.round(scanConfidence * 100)}%` : 'Processing'}
                  </span>
                </div>
                <p className="text-white/80 leading-relaxed font-sans normal-case text-[10px] border-t border-white/5 pt-1.5 mt-1.5">
                  {scanResultNotice}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Templates */}
        <div className="space-y-2 mb-6" id="claim-template-buttons">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="w-full text-left p-3 border border-white/5 bg-white/2 flex flex-col hover:border-flywheel hover:bg-white/5 transition-all text-xs"
            >
              <div className="font-bold flex items-center gap-1.5 text-flywheel">
                <FileText size={10} /> {tpl.label}
              </div>
              <div className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">{tpl.desc}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs" id="custom-claim-form">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Discovery Member ID</label>
              <input
                type="text"
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                className="w-full p-2.5 bg-black border border-white/10 text-white focus:outline-none focus:border-flywheel font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Provider Practice No</label>
              <input
                type="text"
                value={providerPractice}
                onChange={e => setProviderPractice(e.target.value)}
                className="w-full p-2.5 bg-black border border-white/10 text-white focus:outline-none focus:border-flywheel font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">ICD-10 Diagnostic Code</label>
              <input
                type="text"
                value={icd10Code}
                onChange={e => setIcd10Code(e.target.value)}
                className="w-full p-2.5 bg-black border border-white/10 text-white focus:outline-none focus:border-flywheel uppercase font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">CPT Procedure Code</label>
              <input
                type="text"
                value={cptCode}
                onChange={e => setCptCode(e.target.value)}
                className="w-full p-2.5 bg-black border border-white/10 text-white focus:outline-none focus:border-flywheel uppercase font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Claim (ZAR)</label>
              <input
                type="number"
                value={totalClaimed}
                onChange={e => setTotalClaimed(Number(e.target.value))}
                className="w-full p-2.5 bg-black border border-white/10 text-white focus:outline-none focus:border-flywheel font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Service Date</label>
            <input
              type="date"
              value={serviceDate}
              onChange={e => setServiceDate(e.target.value)}
              className="w-full p-2.5 bg-black border border-white/10 text-white focus:outline-none focus:border-flywheel font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-flywheel text-black uppercase font-black tracking-widest text-center border border-flywheel hover:bg-black hover:text-flywheel transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>
            ) : (
              <>
                <PlusCircle size={14} /> Commit Transaction
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 text-flywheel" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
