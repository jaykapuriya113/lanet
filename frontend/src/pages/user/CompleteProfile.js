import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { userProfileAction } from "../../redux/actions/userAction";

const emptyProfile = {
  fullName: "",
  phoneNumber: "",
  contactDetails: "",
  education: "",
  skills: "",
  experience: "",
  profileInformation: "",
  resume: "",
};

const getProfileForm = (user) => ({
  fullName: [user.firstName, user.lastName].filter(Boolean).join(" "),
  phoneNumber: user.phoneNumber || "",
  contactDetails: user.contactDetails || "",
  education: user.education || "",
  skills: user.skills || "",
  experience: user.experience || "",
  profileInformation: user.profileInformation || "",
  resume: user.resume || "",
});

const normalizePhone = (phoneNumber) => phoneNumber.replace(/[\s().-]/g, "");

const getResumeName = (resumeUrl) => {
  if (!resumeUrl) return "No resume uploaded";
  try {
    const parsedUrl = new URL(resumeUrl, window.location.origin);
    return decodeURIComponent(parsedUrl.pathname.split("/").pop());
  } catch (error) {
    return resumeUrl.split("/").pop() || "Uploaded resume";
  }
};

const getResumeRequestUrl = (resumeUrl) => {
  const parsedUrl = new URL(resumeUrl, window.location.origin);
  return parsedUrl.href;
};

const getCompletion = (user, form) => {
  const completedItems = [
    form.fullName.trim(),
    user.email,
    form.phoneNumber.trim(),
    form.education.trim(),
    form.skills.trim(),
    form.experience.trim(),
    form.profileInformation.trim(),
    form.resume,
  ].filter(Boolean).length;

  return Math.round((completedItems / 8) * 100);
};

const CompleteProfile = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.signIn);
  const role = Number(userInfo?.role?.role ?? userInfo?.role ?? 0);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get("/api/me", {
          withCredentials: true,
        });
        if (!active) return;

        const currentUser = data?.user;
        if (!currentUser) {
          setError("Unable to load your profile.");
          return;
        }

        const currentForm = getProfileForm(currentUser);
        setUser(currentUser);
        setForm(currentForm);
        setEditing(getCompletion(currentUser, currentForm) < 100);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.error ||
              "Unable to load your profile. Please sign in again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const changeField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setValidationError("");
  };

  const validateProfile = () => {
    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      return "Enter both your first and last name.";
    }

    const firstName = nameParts.shift();
    const lastName = nameParts.join(" ");
    if (firstName.length > 32 || lastName.length > 32) {
      return "First and last name must each be 32 characters or fewer.";
    }

    const phoneNumber = normalizePhone(form.phoneNumber.trim());
    if (!/^\+?\d{8,15}$/.test(phoneNumber) || !/[1-9]/.test(phoneNumber)) {
      return "Enter a valid contact number with 8 to 15 digits.";
    }
    if (!form.education.trim()) return "Education is required.";
    if (!form.skills.trim()) return "Skills are required.";
    if (!form.experience.trim()) return "Experience is required.";

    return "";
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const validationMessage = validateProfile();
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts.shift();
    const lastName = nameParts.join(" ");
    setSaving(true);
    setError("");

    try {
      const { data } = await axios.patch(
        `/api/user/edit/${user._id}`,
        {
          firstName,
          lastName,
          phoneNumber: normalizePhone(form.phoneNumber.trim()),
          contactDetails: form.contactDetails.trim(),
          education: form.education.trim(),
          skills: form.skills.trim(),
          experience: form.experience.trim(),
          profileInformation: form.profileInformation.trim(),
          resume: form.resume,
        },
        { withCredentials: true },
      );

      const savedUser = data?.user;
      if (!savedUser) throw new Error("The profile could not be saved.");

      const savedForm = getProfileForm(savedUser);
      setUser(savedUser);
      setForm(savedForm);
      setEditing(false);
      await dispatch(userProfileAction());
      toast.success("Profile saved successfully.");
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.message ||
        "Unable to save your profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      file.size > 10 * 1024 * 1024
    ) {
      toast.error("Choose a PDF resume smaller than 10 MB.");
      return;
    }

    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (String.fromCharCode(...header) !== "%PDF-") {
      toast.error("The selected file is not a valid PDF.");
      return;
    }

    setResumeLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const { data } = await axios.post("/api/upload", uploadData, {
        withCredentials: true,
      });
      if (!data?.url)
        throw new Error("The resume upload did not return a file URL.");

      setForm((current) => ({ ...current, resume: data.url }));
      toast.success("Resume uploaded. Save your profile to keep the change.");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to upload your resume.",
      );
    } finally {
      setResumeLoading(false);
    }
  };

  const fetchResume = async () => {
    if (!form.resume) throw new Error("No resume is uploaded.");
    const requestUrl = getResumeRequestUrl(form.resume);
    const { data } = await axios.get(requestUrl, {
      responseType: "blob",
      withCredentials: true,
    });
    return data;
  };

  const viewResume = async () => {
    const resumeWindow = window.open("about:blank", "_blank");
    if (!resumeWindow) {
      toast.error("Allow pop-ups to view your resume.");
      return;
    }

    setResumeLoading(true);
    try {
      const resumeBlob = await fetchResume();
      const objectUrl = URL.createObjectURL(resumeBlob);
      resumeWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (requestError) {
      resumeWindow.close();
      toast.error(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to open your resume.",
      );
    } finally {
      setResumeLoading(false);
    }
  };

  const downloadResume = async () => {
    setResumeLoading(true);
    try {
      const resumeBlob = await fetchResume();
      const objectUrl = URL.createObjectURL(resumeBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getResumeName(form.resume);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to download your resume.",
      );
    } finally {
      setResumeLoading(false);
    }
  };

  const removeResume = () => {
    if (!window.confirm("Remove your resume? Save your profile to confirm.")) {
      return;
    }
    setForm((current) => ({ ...current, resume: "" }));
    toast.info("Resume removal is ready. Save your profile to confirm.");
  };

  if (role !== 0) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ maxWidth: 860, mx: "auto", p: { xs: 2, md: 3 } }}>
        <Alert severity="error">
          {error || "Unable to load your profile."}
        </Alert>
      </Box>
    );
  }

  const completion = getCompletion(user, form);

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: "text.primary", mb: 0.5 }}>
            Complete Profile
          </Typography>
          <Typography color="text.secondary">
            Keep your contact and experience details current.
          </Typography>
        </Box>
        {!editing && (
          <Button
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {validationError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}

      <Paper
        component="section"
        variant="outlined"
        sx={{ p: { xs: 2, md: 3 } }}
      >
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Profile completion
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {completion}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={completion} />
          <Typography variant="body2" color="text.secondary">
            {completion === 100
              ? "Your profile is complete."
              : "Add your details and resume to complete your profile."}
          </Typography>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Box component="form" onSubmit={saveProfile} noValidate>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={changeField}
              required
              disabled={!editing || saving}
              autoComplete="name"
            />
            <TextField
              fullWidth
              label="Email"
              value={user.email || ""}
              required
              disabled
              helperText="Email is linked to your account and cannot be changed here."
            />
            <TextField
              fullWidth
              label="Contact Number"
              name="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={changeField}
              required
              disabled={!editing || saving}
              autoComplete="tel"
              inputProps={{ maxLength: 24 }}
            />
            <TextField
              fullWidth
              label="Additional Contact Details"
              name="contactDetails"
              value={form.contactDetails}
              onChange={changeField}
              disabled={!editing || saving}
            />
            <TextField
              fullWidth
              label="Education"
              name="education"
              value={form.education}
              onChange={changeField}
              required
              disabled={!editing || saving}
            />
            <TextField
              fullWidth
              label="Skills"
              name="skills"
              value={form.skills}
              onChange={changeField}
              required
              disabled={!editing || saving}
              placeholder="For example: React, Node.js, MongoDB"
            />
            <TextField
              fullWidth
              label="Experience"
              name="experience"
              value={form.experience}
              onChange={changeField}
              required
              disabled={!editing || saving}
              multiline
              minRows={2}
              sx={{ gridColumn: { sm: "1 / -1" } }}
            />
            <TextField
              fullWidth
              label="Profile Information / About Me"
              name="profileInformation"
              value={form.profileInformation}
              onChange={changeField}
              disabled={!editing || saving}
              multiline
              minRows={3}
              sx={{ gridColumn: { sm: "1 / -1" } }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Resume
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getResumeName(form.resume)}
              </Typography>
            </Box>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {form.resume && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityOutlinedIcon />}
                    onClick={viewResume}
                    disabled={resumeLoading}
                  >
                    View
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={downloadResume}
                    disabled={resumeLoading}
                  >
                    Download
                  </Button>
                </>
              )}
              {editing && (
                <>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFileOutlinedIcon />}
                    disabled={resumeLoading || saving}
                  >
                    {form.resume ? "Replace PDF" : "Upload PDF"}
                    <input
                      hidden
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={uploadResume}
                    />
                  </Button>
                  {form.resume && (
                    <Button
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={removeResume}
                      disabled={resumeLoading || saving}
                    >
                      Remove
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Stack>

          {resumeLoading && <LinearProgress sx={{ mt: 2 }} />}
          {editing && (
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              justifyContent="flex-end"
              spacing={1.5}
              sx={{ mt: 4 }}
            >
              <Button
                variant="text"
                onClick={() => {
                  setForm(getProfileForm(user));
                  setValidationError("");
                  setEditing(false);
                }}
                disabled={saving || resumeLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                disabled={saving || resumeLoading}
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </Stack>
          )}
          {saving && <LinearProgress sx={{ mt: 2 }} />}
        </Box>
      </Paper>
    </Box>
  );
};

export default CompleteProfile;
