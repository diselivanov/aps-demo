"use client";

import { useState } from "react";
import Step1Upload, { type ParsedCsv } from "./Step1Upload";
import Step2Mapping from "./Step2Mapping";
import Step3Progress from "./Step3Progress";
import Step4Report from "./Step4Report";
import styles from "./index.module.css";

type Props = {
  tableId: number;
};

type Step = "upload" | "mapping" | "progress" | "report";

type ReportItem = {
  rowNumber: number;
  message: string;
};

type Report = {
  created: number;
  skipped: number;
  errors: ReportItem[];
};

export default function ImportWizard({ tableId }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, number> | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Импорт данных</h1>
      <div className={styles.body}>
        {step === "upload" && (
          <Step1Upload
            onParsed={(data) => {
              setParsed(data);
              setStep("mapping");
            }}
            onCancel={() => window.history.back()}
          />
        )}

        {step === "mapping" && parsed && (
          <Step2Mapping
            tableId={tableId}
            headers={parsed.headers}
            onMapped={(m) => {
              setMapping(m);
              setStep("progress");
            }}
            onBack={() => setStep("upload")}
          />
        )}

        {step === "progress" && parsed && mapping && (
          <Step3Progress
            tableId={tableId}
            headers={parsed.headers}
            rows={parsed.rows}
            mapping={mapping}
            onDone={(r) => {
              setReport(r);
              setStep("report");
            }}
          />
        )}

        {step === "report" && report && (
          <Step4Report
            tableId={tableId}
            created={report.created}
            skipped={report.skipped}
            errors={report.errors}
          />
        )}
      </div>
    </div>
  );
}
