import { grey } from "@mui/material/colors";

// ── Sky Blue + White palette ──────────────────────────────────────────────────
// Primary  : #2196F3  (Sky Blue)
// Dark     : #1689D5  (Deep Sky Blue — headings, hover states)
// Light    : #F0F8FF  (Alice Blue — subtle backgrounds)
// White    : #FFFFFF
// Text     : #263238  (Blue-Grey 900 — readable on white)
// Secondary: #1689D5  (used by MUI secondary slots — location icons, subtitles)
// ─────────────────────────────────────────────────────────────────────────────

export const themeColors = (mode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: {
            main:  "#2196F3",   // Sky Blue
            dark:  "#1689D5",   // Deep Sky Blue
            light: "#F0F8FF",   // Alice Blue
            white: "#FFFFFF",
          },
          secondary: {
            main:         "#1689D5",  // Deep Sky Blue
            midNightBlue: "#FFFFFF",
          },
          background: {
            default: "#F0F8FF",
            paper:   "#FFFFFF",
          },
          text: {
            primary:   "#263238",
            secondary: "#546E7A",
          },
        }
      : {
          // Dark mode — keep as a deep navy/blue variant
          primary: {
            main:  "#2196F3",
            dark:  "#1689D5",
            light: "#1a2a3a",
            white: "#1a2a3a",
          },
          secondary: {
            main:         "#2196F3",
            midNightBlue: "#2196f3",
          },
          background: {
            default: "#0d1b2a",
            paper:   "#122030",
          },
          text: {
            primary:   "#e8f4fc",
            secondary: grey[400],
          },
        }),
  },
});
