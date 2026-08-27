import Box from "@mui/material/Box";

export default function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 20,
        borderRadius: "20px",
        backgroundColor: on ? "#9E3A24" : "#DED5C8",
        position: "relative",
        flex: "0 0 auto",
        transition: "background-color .2s",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: "#FFFDFA",
          transition: "left .2s",
        }}
      />
    </Box>
  );
}
