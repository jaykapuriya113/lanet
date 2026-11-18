import { Alert, Avatar, Box, Typography } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import axios from "axios";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";
  const cameFromLogin = params.get("reason") === "unverified";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Please enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/verify-email", {
        email: email.trim(),
        code: code.trim(),
      });
      toast.success(data.message || "Email verified! You can now log in.");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.error || "Verification failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setResending(true);
    try {
      const { data } = await axios.post("/api/resend-verification", {
        email: email.trim(),
      });
      toast.success(data.message || "A new code has been sent.");
    } catch (err) {
      const message =
        err.response?.data?.error || "Could not resend the code.";
      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.white",
          minHeight: "84vh",
        }}
      >
        <Box
          component="form"
          onSubmit={handleVerify}
          className="form_style border-style"
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main", mb: 2 }}>
              <MarkEmailReadIcon />
            </Avatar>
            <Typography variant="h6" sx={{ mb: 1, color: "text.primary" }}>
              Verify your email
            </Typography>
            {cameFromLogin && (
              <Alert severity="warning" sx={{ mb: 2, width: "100%" }}>
                Please verify your email before logging in.
              </Alert>
            )}
            <Typography
              variant="body2"
              sx={{ mb: 3, color: "text.secondary", textAlign: "center" }}
            >
              We sent a 6-digit code to your email. Enter it below. The code
              is valid for 10 minutes.
            </Typography>
            <TextField
              sx={{ mb: 3 }}
              fullWidth
              id="verify-email"
              label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              sx={{ mb: 1 }}
              fullWidth
              id="verify-code"
              label="Verification Code"
              placeholder="123456"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              // No maxLength here: it would truncate a pasted value before
              // non-digits are stripped (e.g. "Code: 123456" -> "").
              inputProps={{ inputMode: "numeric", autoComplete: "one-time-code" }}
              InputLabelProps={{ shrink: true }}
              error={Boolean(error)}
              helperText={error}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              fullWidth
              sx={{
                mt: 2,
                color: "white",
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              {submitting ? "Verifying..." : "Verify"}
            </Button>
            <Button
              type="button"
              onClick={handleResend}
              disabled={resending}
              fullWidth
              sx={{ mt: 1 }}
            >
              {resending ? "Sending..." : "Resend code"}
            </Button>
            <p>
              Already verified?{" "}
              <Link
                to="/login"
                style={{ color: "#2196f3", textDecoration: "none" }}
              >
                Login
              </Link>
            </p>
          </Box>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default VerifyEmail;
