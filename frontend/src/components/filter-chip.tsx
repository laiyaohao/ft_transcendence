import ButtonBase from "@mui/material/ButtonBase";

export default function FilterChip({
  label,
  active,
  onClick,
  square = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  square?: boolean;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        backgroundColor: active ? "#F4E4DE" : "#FBF9F5",
        border: `1px solid ${active ? "#E0B9AC" : "#E4DCD0"}`,
        color: active ? "#9E3A24" : "#5A544C",
        borderRadius: square ? "8px" : "20px",
        px: 1.875,
        py: 1,
        fontSize: 12.5,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </ButtonBase>
  );
}
