import Avatar from "@mui/material/Avatar";

export default function InitialsAvatar({
  initials,
  bg,
  size = 34,
  fontSize = 11.5,
}: {
  initials: string;
  bg: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: bg,
        color: "#3A332C",
        fontSize,
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  );
}
