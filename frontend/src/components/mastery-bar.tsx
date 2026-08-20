import Box from "@mui/material/Box";
import { masteryColor } from "@/data/academic-data";

export default function MasteryBar({
  value,
  height = 5,
  color,
  trackColor = "#F0EAE0",
}: {
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
}) {
  return (
    <Box
      sx={{
        height,
        borderRadius: 20,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, value))}%`,
          backgroundColor: color ?? masteryColor(value),
          borderRadius: 20,
        }}
      />
    </Box>
  );
}
