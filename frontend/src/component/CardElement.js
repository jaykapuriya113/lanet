import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Avatar, IconButton, Stack, Tooltip, useTheme } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import SaveJobButton from "./SaveJobButton";

const CardElement = ({
  jobTitle,
  description,
  category,
  location,
  id,
  profilePhoto,
  AdditionalInformation,
  companyName,
  onRemove,
  detailsLabel = "View Job",
}) => {
  const { palette } = useTheme();

  return (
    <Card
      sx={{
        minWidth: 275,
        mb: 2,
        mt: 2,
        transition: "box-shadow 0.18s, transform 0.18s",
        "&:hover": {
          boxShadow: "0 6px 20px rgba(23,59,54,0.12)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        {/* ── Header row: location + avatar ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOnIcon sx={{ color: palette.secondary.main, fontSize: 18 }} />
            <Typography
              variant="body2"
              sx={{ fontSize: 15, color: palette.secondary.main, fontWeight: 500 }}
            >
              {location}
            </Typography>
          </Stack>

          <Tooltip title="Recruiter profile">
            <IconButton sx={{ p: 0 }}>
              <Avatar
                alt=""
                src={profilePhoto}
                sx={{ width: 36, height: 36, color: palette.primary.white }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        {/*
         * The entire content block (title, company, description) is wrapped in a
         * <Link> so ANY click on the card body navigates to the job-details page.
         * Using `display: block` keeps it block-level; `color: inherit` prevents
         * the browser default blue-link colour from leaking through.
         */}
        <Link
          to={`/job/${id}`}
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
        >
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            {jobTitle}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, fontSize: "16px", color: "#555", mt: 0.25 }}
          >
            {companyName}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, textAlign: "justify", color: "text.secondary" }}>
            <span style={{ fontWeight: "bold" }}>Description: </span>
            {description?.split(" ")?.slice(0, 15)?.join(" ") + "…"}
          </Typography>
        </Link>
      </CardContent>

      {/* ── Actions row ── */}
      <CardActions sx={{ pt: 1 }}>
        {/* Explicit CTA button — also a Link so it works as a standalone click target */}
        <Button
          disableElevation
          variant="contained"
          size="small"
          endIcon={<ArrowForwardIcon />}
          component={Link}
          to={`/job/${id}`}
          sx={{
            ml: -0.5,
            textDecoration: "none",
            color: "white",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          {detailsLabel}
        </Button>

        {/* Save bookmark — independent click, must NOT be inside the card Link */}
        <SaveJobButton jobId={id} size="small" />

        {onRemove && (
          <Button size="small" color="error" onClick={onRemove}>
            Remove
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default CardElement;
