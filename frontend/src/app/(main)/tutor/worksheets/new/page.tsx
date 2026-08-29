"use client";

import { useSearchParams } from "next/navigation";

import { WorksheetBuilder } from "@/components/worksheets/WorksheetBuilder";

function positiveQueryId(value: string | null): number | undefined {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

/** The profile action supplies both identifiers; the builder verifies membership before it sends a request. */
export default function Page() {
  const params = useSearchParams();
  return <WorksheetBuilder classId={positiveQueryId(params.get("classId")) ?? 0} initialStudentId={positiveQueryId(params.get("studentId"))} />;
}
