"use client";

import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import HistoryIcon from "@mui/icons-material/History";
import { fetchMyMistakes, type MistakeHistoryItem } from "@/services/mistakes";

const card = { borderColor: "#EBE4D9", bgcolor: "#FFFDFA", borderRadius: "14px", boxShadow: "none" };
const typeTone = { bgcolor: "#F7E3DC", color: "#9E3A24", borderColor: "#E0B9AC" };

function dateLabel(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Recorded recently" : parsed.toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function Page() {
  const [items, setItems] = React.useState<MistakeHistoryItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedType, setSelectedType] = React.useState("all");

  const load = React.useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      setItems(await fetchMyMistakes());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mistake history could not be loaded.");
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the async load owns its loading state.
  React.useEffect(() => { void load(); }, [load]);

  const types = React.useMemo(() => Array.from(new Set((items ?? []).map((item) => item.mistakeType))), [items]);
  const visible = selectedType === "all" ? items ?? [] : (items ?? []).filter((item) => item.mistakeType === selectedType);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F4EF", py: { xs: 2.5, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ maxWidth: 1040, mx: "auto" }}>
        <Typography sx={{ color: "#A09488", fontSize: 10.5, fontWeight: 700, letterSpacing: ".13em", mb: .75 }}>APPROVED LEARNING HISTORY</Typography>
        <Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2A2622", fontSize: { xs: 31, sm: 40 }, lineHeight: 1.1 }}>Mistake review</Typography>
        <Typography sx={{ color: "#6F675E", mt: .75, mb: 3, maxWidth: 670, lineHeight: 1.6 }}>
          These are the mistakes your Tutor has confirmed. Use the topic links to revisit the underlying learning area.
        </Typography>

        {items === null && !error ? <Stack spacing={1.25} aria-label="Loading approved mistake history">
          {[1, 2, 3].map((index) => <Card key={index} variant="outlined" sx={{ ...card, height: 140, bgcolor: "#F0EAE0" }} />)}
        </Stack> : null}

        {error ? <Card variant="outlined" sx={{ ...card, borderLeft: "3px solid #B4573F", borderRadius: "0 10px 10px 0", p: 2.5, maxWidth: 620 }} role="alert">
          <Typography sx={{ color: "#4A443D", lineHeight: 1.6 }}>{error}</Typography>
          <Button onClick={() => void load()} variant="outlined" sx={{ mt: 1.5, borderColor: "#E4DCD0", color: "#2A2622", textTransform: "none" }}>Try again</Button>
        </Card> : null}

        {items !== null && !error ? <>
          {types.length > 1 ? <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1, mb: 2.25 }} aria-label="Filter by mistake type">
            <Chip label="All types" onClick={() => setSelectedType("all")} aria-pressed={selectedType === "all"} sx={{ fontWeight: 600, bgcolor: selectedType === "all" ? "#2A2622" : "#FFFDFA", color: selectedType === "all" ? "#FFFDFA" : "#4A443D" }} />
            {types.map((type) => <Chip key={type} label={items.find((item) => item.mistakeType === type)?.mistakeLabel ?? type} onClick={() => setSelectedType(type)} aria-pressed={selectedType === type} variant="outlined" sx={{ fontWeight: 600, borderColor: selectedType === type ? "#9E3A24" : "#E4DCD0", bgcolor: selectedType === type ? "#F7E3DC" : "#FFFDFA", color: "#4A443D" }} />)}
          </Stack> : null}
          {visible.length === 0 ? <Card variant="outlined" sx={{ ...card, borderStyle: "dashed", borderColor: "#DCCFBE", px: 3, py: 6, textAlign: "center" }}>
            <CheckCircleOutlineIcon aria-hidden="true" sx={{ color: "#5C7A63", fontSize: 42, mb: 1 }} />
            <Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#2A2622" }}>{items.length === 0 ? "No confirmed mistakes yet" : "No mistakes match this type"}</Typography>
            <Typography sx={{ color: "#8B837A", mt: .75 }}>{items.length === 0 ? "Your Tutor-approved learning history will appear here after a review." : "Choose all types to see your full history."}</Typography>
            {items.length > 0 ? <Button onClick={() => setSelectedType("all")} sx={{ mt: 1.5, color: "#9E3A24", textTransform: "none" }}>Show all types</Button> : null}
          </Card> : <Stack spacing={1.5}>
            {visible.map((item) => <Card key={item.id} variant="outlined" sx={{ ...card, p: { xs: 2, sm: 2.5 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, mb: 1.25 }}>
                <Chip label={item.mistakeLabel} size="small" variant="outlined" sx={{ ...typeTone, fontWeight: 700, alignSelf: "flex-start" }} />
                <Typography sx={{ color: "#8B837A", fontSize: 12.5 }}>{item.syllabusTopicCode ?? "Linked topic"} · {dateLabel(item.recordedAt)}</Typography>
                <Chip icon={<HistoryIcon />} label="Tutor confirmed" size="small" sx={{ ml: { sm: "auto" }, alignSelf: "flex-start", bgcolor: "#E4EDE4", color: "#4A6B50", fontWeight: 600 }} />
              </Stack>
              <Typography sx={{ color: "#4A443D", lineHeight: 1.65 }}>{item.description}</Typography>
              {item.syllabusTopicId ? <Button component={Link} href={`/topics/${item.syllabusTopicId}`} sx={{ mt: .75, px: 0, minHeight: 32, color: "#9E3A24", textTransform: "none" }}>Review this topic</Button> : null}
            </Card>)}
          </Stack>}
        </> : null}
      </Box>
    </Box>
  );
}
