import Chip from "@mui/material/Chip";
import { STATUS_META, StudentStatus } from "@/data/academic-data";

export default function StatusChip({ status }: { status: StudentStatus }) {
  const meta = STATUS_META[status];
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: 0.5,
        backgroundColor: meta.bg,
        color: meta.color,
      }}
    />
  );
}
