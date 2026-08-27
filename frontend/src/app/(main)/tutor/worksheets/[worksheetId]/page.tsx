"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import TutorWorksheetDetail from "@/components/worksheets/TutorWorksheetDetail";
import { fetchTutorWorksheet, type TutorWorksheet } from "@/services/worksheets";

export default function Page() {
  const { worksheetId } = useParams<{ worksheetId: string }>();
  const id = Number(worksheetId);
  const validId = Number.isSafeInteger(id) && id > 0;
  const [data, setData] = React.useState<TutorWorksheet | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!validId) return;
    let active = true;
    fetchTutorWorksheet(id).then((worksheet) => {
      if (active) setData(worksheet);
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : "Worksheet could not be opened.");
    });
    return () => { active = false; };
  }, [id, validId]);

  if (!validId) return <Box sx={{ p: 3 }}><Typography role="alert">Worksheet could not be opened.</Typography></Box>;
  if (error) return <Box sx={{ p: 3 }}><Typography role="alert">{error}</Typography></Box>;
  if (!data) return <Box sx={{ p: 3 }}><Typography>Loading worksheet…</Typography></Box>;
  return <TutorWorksheetDetail key={worksheetId} worksheet={data} />;
}
