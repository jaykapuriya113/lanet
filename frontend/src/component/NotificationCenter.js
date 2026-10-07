import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

const STATUS_LABELS = {
  pending: "Applied",
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  accepted: "Selected",
  rejected: "Rejected",
};

const getStatusLabel = (status = "") =>
  STATUS_LABELS[status] || status.replace(/[_-]/g, " ");

const formatInterviewTime = (value) => {
  if (!value) return "Not available";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const NotificationCenter = ({ userId, isRecruiter = false }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    setError("");
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    let active = true;
    const loadUnreadCount = async () => {
      try {
        const { data } = await axios.get(
          "/api/user/notifications/unread-count",
        );
        if (!active) return;
        setUnreadCount(data.unreadCount || 0);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.error ||
              "Unable to load notifications.",
          );
        }
      }
    };

    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 30000);
    window.addEventListener("focus", loadUnreadCount);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnreadCount);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !anchorEl) return undefined;

    let active = true;
    const loadNotifications = async () => {
      try {
        const { data } = await axios.get("/api/user/notifications");
        if (!active) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setError("");
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.error ||
              "Unable to load notifications.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);
    window.addEventListener("focus", loadNotifications);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadNotifications);
    };
  }, [userId, anchorEl]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        const { data } = await axios.patch(
          `/api/user/notifications/${encodeURIComponent(notification._id)}/read`,
        );
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? data.notification : item,
          ),
        );
        setUnreadCount(data.unreadCount || 0);
        setError("");
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            "Unable to mark notification as read.",
        );
        return;
      }
    }
    handleClose();
    if (
      notification.notificationType === "application_deadline" ||
      notification.notificationType === "new_job"
    ) {
      if (notification.jobId) {
        navigate(`/job/${notification.jobId}`);
      }
      return;
    }

    const applicationId =
      notification.applicationId?._id || notification.applicationId;
    if (applicationId) {
      if (notification.notificationType === "interview_response" && isRecruiter) {
        navigate(`/recruiter/application/${applicationId}`);
      } else if (!isRecruiter) {
        navigate("/user/jobs", {
          state: { applicationId: String(applicationId) },
        });
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch("/api/user/notifications/read-all");
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Unable to mark notifications as read.",
      );
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleOpen}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: "min(400px, calc(100vw - 24px))",
            maxHeight: "min(70vh, 600px)",
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Notifications</Typography>
            <Button
              size="small"
              disabled={!unreadCount}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          </Stack>
        </Box>
        <Divider />
        {error && <Alert severity="error">{error}</Alert>}
        {loading && notifications.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={24} aria-label="Loading notifications" />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography sx={{ px: 2, py: 3 }} color="text.secondary">
            No notifications yet.
          </Typography>
        ) : (
          notifications.map((notification) => {
            const status = String(notification.status || "").toLowerCase();
            const statusColor =
              notification.notificationType === "application_deadline"
                ? "warning"
                : notification.notificationType === "new_job"
                  ? "primary"
                : status === "rejected" || status === "declined"
                ? "error"
                : status === "selected" || status === "accepted"
                  ? "success"
                  : "primary";
            const statusText =
              notification.notificationType === "application_deadline"
                ? notification.deadlineDaysBefore === 0
                  ? "Deadline today"
                  : `${notification.deadlineDaysBefore} day${notification.deadlineDaysBefore === 1 ? "" : "s"} left`
                : notification.notificationType === "new_job"
                  ? "New job"
                : notification.notificationType === "interview_response"
                  ? notification.status === "accepted"
                    ? "Accepted"
                    : "Declined"
                  : getStatusLabel(notification.status);
            const createdAt = new Date(notification.createdAt);
            const formattedDate = Number.isNaN(createdAt.getTime())
              ? ""
              : createdAt.toLocaleString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });

            return (
              <MenuItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  alignItems: "flex-start",
                  whiteSpace: "normal",
                  py: 1.5,
                  borderLeft: notification.isRead
                    ? "3px solid transparent"
                    : "3px solid",
                  borderColor: notification.isRead
                    ? "transparent"
                    : "primary.main",
                  bgcolor: notification.isRead
                    ? "background.paper"
                    : "action.hover",
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 0.75 }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      {notification.notificationType === "interview"
                        ? "Interview Invitation"
                        : notification.notificationType === "application_deadline"
                          ? "Application Deadline Reminder"
                          : notification.notificationType === "new_job"
                            ? "New Job Alert"
                          : notification.notificationType === "interview_response"
                            ? "Interview Response"
                            : "Application Status Updated"}
                    </Typography>
                    <Chip
                      size="small"
                      label={notification.isRead ? "Read" : "Unread"}
                      color={notification.isRead ? "default" : "info"}
                    />
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 0.75 }}>
                    {notification.message}
                  </Typography>
                  {notification.notificationType === "interview" && (
                    <Box sx={{ mb: 1 }}>
                      {notification.candidateName && (
                        <Typography variant="body2">
                          Candidate: {notification.candidateName}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        Date:{" "}
                        {notification.interviewDate
                          ? new Date(
                              `${notification.interviewDate}T12:00:00`,
                            ).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Not available"}
                      </Typography>
                      <Typography variant="body2">
                        Time: {formatInterviewTime(notification.interviewTime)}
                      </Typography>
                      <Typography variant="body2">
                        Mode:{" "}
                        {notification.interviewMode === "online"
                          ? "Online"
                          : notification.interviewMode || "Not available"}
                      </Typography>
                      {notification.meetingLink && (
                        <Typography
                          variant="body2"
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          Meeting Link:{" "}
                          <Link
                            href={notification.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {notification.meetingLink}
                          </Link>
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Chip
                      size="small"
                      color={statusColor}
                      label={statusText}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formattedDate}
                    </Typography>
                  </Stack>
                </Box>
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
