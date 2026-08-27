import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

export default function WizardStepper({
  labels,
  active,
  onJump,
}: {
  labels: string[];
  active: number;
  onJump: (index: number) => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 4.25, px: 0.75 }}>
      {labels.map((label, i) => {
        const done = i < active;
        const now = i === active;
        const dotBg = done ? "#9E3A24" : now ? "#FFFDFA" : "#F4EFE6";
        const dotColor = done ? "#FBF9F5" : now ? "#9E3A24" : "#BCB1A3";
        const ringColor = done || now ? "#9E3A24" : "#E4DCD0";
        const lineBg = done ? "#9E3A24" : "#E4DCD0";
        const labelColor = done || now ? "#2A2622" : "#A09488";
        return (
          <Box key={label} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <Box sx={{ position: "absolute", top: 14, left: 0, right: 0, height: "2px", backgroundColor: lineBg }} />
            <ButtonBase
              onClick={() => i <= active && onJump(i)}
              sx={{
                position: "relative",
                width: 29,
                height: 29,
                borderRadius: "50%",
                border: `2px solid ${ringColor}`,
                backgroundColor: dotBg,
                color: dotColor,
                fontSize: 11.5,
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              {done ? "✓" : i + 1}
            </ButtonBase>
            <Typography sx={{ fontSize: 11.5, fontWeight: now ? 600 : 400, color: labelColor, mt: 1.125, whiteSpace: "nowrap" }}>
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
