import React from "react";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";

export default function SkeletonColor({ busyStep }) {
  return (
    <Box
      sx={{
        bgcolor: "#121212",
        p: { xs: 4, sm: 8 },
        width: "100%",
        minHeight: "420px",
        maxHeight: "70vh",
        borderRadius: "1rem",
        border: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Skeleton
        sx={{ bgcolor: "grey.900", borderRadius: "0.75rem" }}
        variant="rectangular"
        width={210}
        height={118}
      />
      {busyStep && (
        <Box
          sx={{
            mt: 3,
            color: "#a5b4fc",
            fontSize: "0.85rem",
            fontWeight: 500,
            bgcolor: "rgba(99, 102, 241, 0.12)",
            px: 2.5,
            py: 0.75,
            borderRadius: "9999px",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
          <span>{busyStep}</span>
        </Box>
      )}
    </Box>
  );
}
