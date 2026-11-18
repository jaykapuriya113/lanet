import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resumeAnalyzeAction, prepPlanAction } from "../../redux/actions/userAction";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import AutoAwesomeIcon      from "@mui/icons-material/AutoAwesome";
import WorkIcon             from "@mui/icons-material/Work";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon     from "@mui/icons-material/HighlightOff";
import TrendingUpIcon       from "@mui/icons-material/TrendingUp";
import InfoOutlinedIcon     from "@mui/icons-material/InfoOutlined";
import SchoolIcon           from "@mui/icons-material/School";
import BusinessCenterIcon   from "@mui/icons-material/BusinessCenter";
import CodeIcon             from "@mui/icons-material/Code";
import MenuBookIcon         from "@mui/icons-material/MenuBook";
import ExpandMoreIcon       from "@mui/icons-material/ExpandMore";
import AccessTimeIcon       from "@mui/icons-material/AccessTime";
import QuizIcon             from "@mui/icons-material/Quiz";
import TopicIcon            from "@mui/icons-material/Topic";
import FitnessCenterIcon    from "@mui/icons-material/FitnessCenter";
import CalendarMonthIcon    from "@mui/icons-material/CalendarMonth";
import OpenInNewIcon        from "@mui/icons-material/OpenInNew";
import FlagIcon             from "@mui/icons-material/Flag";

// ── helpers ───────────────────────────────────────────────────────────────────

const scoreColor = (s) => (s >= 70 ? "#4caf50" : s >= 40 ? "#ff9800" : "#f44336");

const PRIORITY_META = {
  high:   { label: "High Priority",   color: "#d32f2f", bg: "#fdecea" },
  medium: { label: "Medium Priority", color: "#f57c00", bg: "#fff3e0" },
  low:    { label: "Low Priority",    color: "#388e3c", bg: "#e8f5e9" },
};

// ── Weekly Progress Tracker ───────────────────────────────────────────────────
const WeeklyTracker = ({ weeklyPlan, skill }) => {
  // Persist checkbox state in component-local state keyed by "skill-week-topicIdx"
  const [checked, setChecked] = useState({});

  if (!weeklyPlan || weeklyPlan.length === 0) return null;

  const allTopics = weeklyPlan.flatMap((w) =>
    (w.topics || []).map((t, ti) => `${w.week}-${ti}`)
  );
  const completedCount = allTopics.filter((k) => checked[`${skill}-${k}`]).length;
  const progress = allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0;

  const toggle = (key) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: "#f3e5f5", border: "1px solid #ce93d8" }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <CalendarMonthIcon sx={{ color: "#7b1fa2", fontSize: 18 }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#7b1fa2" }}>
          Weekly Progress Tracker
        </Typography>
        <Chip
          label={`${progress}% complete`}
          size="small"
          sx={{
            ml: "auto",
            bgcolor: progress === 100 ? "#4caf50" : "#e1bee7",
            color: progress === 100 ? "white" : "#4a148c",
            fontWeight: 700,
            fontSize: "0.7rem",
          }}
        />
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          mb: 1.5,
          bgcolor: "#e1bee7",
          "& .MuiLinearProgress-bar": { bgcolor: "#7b1fa2" },
        }}
      />

      {weeklyPlan.map((w) => (
        <Box key={w.week} sx={{ mb: 1 }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: "#4a148c", display: "block", mb: 0.3 }}>
            Week {w.week}: {w.goal}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {(w.topics || []).map((topic, ti) => {
              const key = `${skill}-${w.week}-${ti}`;
              const done = !!checked[key];
              return (
                <Tooltip key={ti} title={done ? "Mark as pending" : "Mark as completed"}>
                  <Chip
                    icon={
                      <Checkbox
                        checked={done}
                        onChange={() => toggle(key)}
                        size="small"
                        sx={{ p: 0, color: done ? "#7b1fa2" : "inherit" }}
                      />
                    }
                    label={topic}
                    size="small"
                    onClick={() => toggle(key)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: done ? "#ce93d8" : "#f3e5f5",
                      color: done ? "#4a148c" : "#6a1b9a",
                      fontWeight: done ? 700 : 400,
                      textDecoration: done ? "line-through" : "none",
                      fontSize: "0.7rem",
                      border: "1px solid #ce93d8",
                    }}
                  />
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
      ))}

      <Typography variant="caption" color="text.secondary">
        {completedCount} of {allTopics.length} topics completed
      </Typography>
    </Box>
  );
};

// ── Preparation Plan Panel ────────────────────────────────────────────────────
const PrepPlanPanel = ({ jobId, matchedSkills, missingSkills, jobTitle }) => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);

  const planState = useSelector((state) => state.prepPlan[jobId]) || {};
  const { loading, plan, error } = planState;

  const handleClick = () => {
    if (!open && !plan && !loading)
      dispatch(prepPlanAction(jobId, matchedSkills, missingSkills));
    setOpen((v) => !v);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        size="small"
        startIcon={<MenuBookIcon />}
        onClick={handleClick}
        sx={{
          background: "linear-gradient(90deg,#1769aa,#42a5f5)",
          color: "white",
          fontWeight: 700,
          textTransform: "none",
          borderRadius: 2,
          px: 2,
          "&:hover": { background: "linear-gradient(90deg,#125699,#1e88e5)" },
        }}
      >
        {open ? "Hide Preparation Plan" : "Prepare Before Applying"}
      </Button>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, p: 2.5, borderRadius: 3, bgcolor: "#f0f7ff", border: "1.5px solid #90caf9" }}>
          {loading && (
            <Stack alignItems="center" spacing={1} py={3}>
              <CircularProgress size={36} sx={{ color: palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                AI is generating your preparation plan…
              </Typography>
            </Stack>
          )}

          {error && !loading && (
            <Alert
              severity="error"
              action={
                <Button size="small" color="inherit"
                  onClick={() => dispatch(prepPlanAction(jobId, matchedSkills, missingSkills))}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {plan && !loading && (
            <>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <AutoAwesomeIcon sx={{ color: palette.primary.main }} />
                <Typography variant="h6" fontWeight={700} color="primary">
                  Preparation Plan — {jobTitle}
                </Typography>
              </Stack>

              {plan.length === 0 && (
                <Alert severity="info">
                  No specific skills to prepare — you already match this role well!
                </Alert>
              )}

              {plan.map((item, idx) => {
                const pm = PRIORITY_META[item.priority] || PRIORITY_META.medium;
                return (
                  <Accordion
                    key={idx}
                    defaultExpanded={idx === 0}
                    disableGutters
                    sx={{
                      mb: 1.5,
                      borderRadius: "10px !important",
                      border: "1px solid #bbdefb",
                      "&:before": { display: "none" },
                      boxShadow: "none",
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: "#e3f2fd",
                        borderRadius: "10px",
                        minHeight: 48,
                        "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 },
                      }}
                    >
                      <HighlightOffIcon sx={{ color: "#f44336", fontSize: 18 }} />
                      <Typography fontWeight={700} sx={{ textTransform: "capitalize" }}>
                        {item.skill}
                      </Typography>

                      {/* Priority chip */}
                      <Chip
                        icon={<FlagIcon sx={{ fontSize: "13px !important", color: `${pm.color} !important` }} />}
                        label={pm.label}
                        size="small"
                        sx={{ bgcolor: pm.bg, color: pm.color, fontWeight: 700, fontSize: "0.68rem" }}
                      />

                      {item.estimatedTime && (
                        <Chip
                          icon={<AccessTimeIcon sx={{ fontSize: "14px !important" }} />}
                          label={item.estimatedTime}
                          size="small"
                          sx={{ ml: "auto", mr: 1, bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600, fontSize: "0.7rem" }}
                        />
                      )}
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 1.5, bgcolor: "white", borderRadius: "0 0 10px 10px" }}>
                      {/* What to learn */}
                      {item.whatToLearn && (
                        <Box mb={1.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                            <InfoOutlinedIcon sx={{ fontSize: 16, color: "#1769aa" }} />
                            <Typography variant="subtitle2" fontWeight={700} color="primary">What to Learn</Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ pl: 2.5 }}>
                            {item.whatToLearn}
                          </Typography>
                        </Box>
                      )}

                      {/* Key Topics with Resources */}
                      {item.keyTopics?.length > 0 && (
                        <Box mb={1.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center" mb={0.8}>
                            <TopicIcon sx={{ fontSize: 16, color: "#388e3c" }} />
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#388e3c" }}>
                              Key Topics &amp; Resources
                            </Typography>
                          </Stack>
                          <Box sx={{ pl: 2.5 }}>
                            {item.keyTopics.map((kt, ti) => (
                              <Box key={ti} sx={{ mb: 1 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ color: "#1b5e20" }}>
                                  {ti + 1}. {kt.topic || kt}
                                </Typography>
                                {kt.resources?.length > 0 && (
                                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.3} pl={1.5}>
                                    {kt.resources.map((r, ri) => (
                                      <Chip
                                        key={ri}
                                        label={r.title}
                                        size="small"
                                        icon={<OpenInNewIcon sx={{ fontSize: "12px !important" }} />}
                                        component="a"
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        clickable
                                        sx={{
                                          bgcolor: "#e8f5e9",
                                          color: "#2e7d32",
                                          fontWeight: 600,
                                          fontSize: "0.68rem",
                                          "& .MuiChip-icon": { color: "#2e7d32" },
                                          "&:hover": { bgcolor: "#c8e6c9" },
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Practical Exercises */}
                      {item.practicalExercises?.length > 0 && (
                        <Box mb={1.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center" mb={0.8}>
                            <FitnessCenterIcon sx={{ fontSize: 16, color: "#0277bd" }} />
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0277bd" }}>
                              Practical Exercises
                            </Typography>
                          </Stack>
                          <Box sx={{ pl: 2.5 }}>
                            {item.practicalExercises.map((ex, ei) => (
                              <Stack key={ei} direction="row" spacing={1} mb={0.5}>
                                <Typography variant="body2" sx={{ color: "#01579b", fontWeight: 700, minWidth: 22 }}>
                                  {ei + 1}.
                                </Typography>
                                <Typography variant="body2" color="text.secondary">{ex}</Typography>
                              </Stack>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Interview Questions */}
                      {item.interviewQuestions?.length > 0 && (
                        <Box mb={1.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center" mb={0.8}>
                            <QuizIcon sx={{ fontSize: 16, color: "#7b1fa2" }} />
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#7b1fa2" }}>
                              Interview Questions
                            </Typography>
                          </Stack>
                          <Box sx={{ pl: 2.5 }}>
                            {item.interviewQuestions.map((q, qi) => (
                              <Stack key={qi} direction="row" spacing={1} mb={0.5}>
                                <Typography variant="body2" sx={{ color: "#4a148c", fontWeight: 700, minWidth: 22 }}>
                                  Q{qi + 1}.
                                </Typography>
                                <Typography variant="body2" color="text.secondary">{q}</Typography>
                              </Stack>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Weekly Progress Tracker */}
                      <WeeklyTracker weeklyPlan={item.weeklyPlan} skill={item.skill} />
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              <Divider sx={{ my: 2 }} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<MenuBookIcon />}
                  onClick={() => dispatch(prepPlanAction(jobId, matchedSkills, missingSkills))}
                  sx={{ bgcolor: "#1769aa", textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#125699" } }}
                >
                  Refresh Plan
                </Button>
                <Button
                  component={Link} to={`/job/${jobId}`}
                  variant="outlined" size="small"
                  startIcon={<WorkIcon />}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, borderColor: "#1769aa", color: "#1769aa" }}
                >
                  Apply Now
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ResumeRecommendations = () => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const { loading, resumeProfile, recommendations, error } = useSelector(
    (state) => state.resumeAnalyze
  );

  useEffect(() => { dispatch(resumeAnalyzeAction()); }, [dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress size={56} sx={{ color: palette.primary.main }} />
        <Typography variant="h6" color="text.secondary">Analyzing your resume with AI…</Typography>
        <Typography variant="body2" color="text.secondary">This may take up to 15 seconds</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={() => dispatch(resumeAnalyzeAction())}>Retry</Button>}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
        {error.toLowerCase().includes("upload") && (
          <Button component={Link} to="/user/complete-profile" variant="contained" sx={{ mt: 1 }}>
            Upload Resume
          </Button>
        )}
      </Box>
    );
  }

  if (!resumeProfile) return null;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ pb: 3 }}>
        <AutoAwesomeIcon sx={{ color: palette.primary.main, fontSize: 28 }} />
        <Typography variant="h4" sx={{ color: "black", fontWeight: 700 }}>AI Resume Analyzer</Typography>
      </Stack>

      {/* Profile Summary */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: palette.primary.main }}>
            Your AI-Extracted Profile
          </Typography>
          {resumeProfile.summary && (
            <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
              {resumeProfile.summary}
            </Typography>
          )}
          <Grid container spacing={2}>
            {resumeProfile.education && (
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <SchoolIcon sx={{ color: palette.primary.main, mt: 0.3 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>Education</Typography>
                    <Typography variant="body2" color="text.secondary">{resumeProfile.education}</Typography>
                  </Box>
                </Stack>
              </Grid>
            )}
            {resumeProfile.experience && (
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <BusinessCenterIcon sx={{ color: palette.primary.main, mt: 0.3 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>Experience</Typography>
                    <Typography variant="body2" color="text.secondary">{resumeProfile.experience}</Typography>
                  </Box>
                </Stack>
              </Grid>
            )}
            {resumeProfile.domain && (
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <WorkIcon sx={{ color: palette.primary.main, mt: 0.3 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>Primary Domain</Typography>
                    <Typography variant="body2" color="text.secondary">{resumeProfile.domain}</Typography>
                  </Box>
                </Stack>
              </Grid>
            )}
          </Grid>
          {resumeProfile.skills?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Skills</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {resumeProfile.skills.map((s, i) => (
                  <Chip key={i} label={s} size="small"
                    sx={{ bgcolor: palette.primary.main + "18", color: palette.primary.main, fontWeight: 600 }} />
                ))}
              </Stack>
            </Box>
          )}
          {resumeProfile.technologies?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CodeIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700}>Technologies</Typography>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {resumeProfile.technologies.map((t, i) => (
                  <Chip key={i} label={t} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Job Recommendations */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Recommended Jobs{" "}
        <Typography component="span" variant="body1" color="text.secondary" fontWeight={400}>
          ({recommendations.length} found)
        </Typography>
      </Typography>

      {recommendations.length === 0 ? (
        <Alert severity="info" icon={<InfoOutlinedIcon />}>
          No active jobs found to match against. Check back when new jobs are posted.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {recommendations.map(
            ({ job, matchScore, matchedSkills, needsImprovementSkills = [], missingSkills, whyThisJob }, i) => (
              <Grid item xs={12} key={job._id || i}>
                <Card sx={{
                  borderRadius: 3, boxShadow: 1,
                  border: `1.5px solid ${scoreColor(matchScore)}30`,
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 4 },
                }}>
                  <CardContent>
                    {/* Title + score */}
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1} sx={{ mb: 1.5 }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={700}
                          component={Link} to={`/job/${job._id}`}
                          sx={{ textDecoration: "none", color: palette.primary.main, "&:hover": { textDecoration: "underline" } }}>
                          {job.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {job.companyName}{job.location ? ` • ${job.location}` : ""}{job.salary ? ` • ${job.salary}` : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center", minWidth: 80 }}>
                        <Typography variant="h5" fontWeight={800} sx={{ color: scoreColor(matchScore), lineHeight: 1 }}>
                          {matchScore}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>MATCH</Typography>
                      </Box>
                    </Stack>

                    <LinearProgress
                      variant="determinate" value={matchScore}
                      sx={{
                        height: 6, borderRadius: 3, mb: 2,
                        bgcolor: scoreColor(matchScore) + "22",
                        "& .MuiLinearProgress-bar": { bgcolor: scoreColor(matchScore), borderRadius: 3 },
                      }}
                    />

                    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
                      <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 18, mt: 0.2 }} />
                      <Typography variant="body2" color="text.secondary">{whyThisJob}</Typography>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {/* Three-column skill grid */}
                    <Grid container spacing={2}>
                      {/* Matched */}
                      <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
                          <CheckCircleOutlineIcon sx={{ color: "#4caf50", fontSize: 16 }} />
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#4caf50" }}>Matched</Typography>
                        </Stack>
                        {matchedSkills.length > 0 ? (
                          <Stack direction="row" flexWrap="wrap" gap={0.7}>
                            {matchedSkills.map((s, j) => (
                              <Chip key={j} label={s} size="small"
                                sx={{ bgcolor: "#4caf5015", color: "#2e7d32", fontWeight: 600, fontSize: "0.72rem" }} />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </Grid>

                      {/* Needs Improvement */}
                      <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
                          <TrendingUpIcon sx={{ color: "#ff9800", fontSize: 16 }} />
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#ff9800" }}>Needs Improvement</Typography>
                        </Stack>
                        {needsImprovementSkills.length > 0 ? (
                          <Stack direction="row" flexWrap="wrap" gap={0.7}>
                            {needsImprovementSkills.map((s, j) => (
                              <Chip key={j} label={s} size="small"
                                sx={{ bgcolor: "#ff980015", color: "#e65100", fontWeight: 600, fontSize: "0.72rem" }} />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </Grid>

                      {/* Missing */}
                      <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
                          <HighlightOffIcon sx={{ color: "#f44336", fontSize: 16 }} />
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#f44336" }}>Missing Skills</Typography>
                        </Stack>
                        {missingSkills.length > 0 ? (
                          <Stack direction="row" flexWrap="wrap" gap={0.7}>
                            {missingSkills.map((s, j) => (
                              <Chip key={j} label={s} size="small"
                                sx={{ bgcolor: "#f4433615", color: "#c62828", fontWeight: 600, fontSize: "0.72rem" }} />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </Grid>
                    </Grid>

                    {/* Preparation Plan */}
                    <PrepPlanPanel
                      jobId={job._id}
                      matchedSkills={matchedSkills}
                      missingSkills={[...needsImprovementSkills, ...missingSkills]}
                      jobTitle={job.title}
                    />

                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                      <Button component={Link} to={`/job/${job._id}`}
                        variant="outlined" size="small"
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                        View Job
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}
        </Grid>
      )}
    </Box>
  );
};

export default ResumeRecommendations;
