import axios from "axios";
import { toast } from "react-toastify";
import {
  ALL_USER_LOAD_FAIL,
  ALL_USER_LOAD_REQUEST,
  ALL_USER_LOAD_SUCCESS,
  EDIT_USER_FAIL,
  EDIT_USER_REQUEST,
  EDIT_USER_SUCCESS,
  USER_APPLY_JOB_FAIL,
  USER_APPLY_JOB_REQUEST,
  USER_APPLY_JOB_SUCCESS,
  USER_APPLICATIONS_LOAD_FAIL,
  USER_APPLICATIONS_LOAD_REQUEST,
  USER_APPLICATIONS_LOAD_SUCCESS,
  USER_DELETE_FAIL,
  USER_DELETE_REQUEST,
  USER_DELETE_SUCCESS,
  USER_FORGET_PASSWORD_FAIL,
  USER_FORGET_PASSWORD_REQUEST,
  USER_FORGET_PASSWORD_SUCCESS,
  USER_LOAD_FAIL,
  USER_LOAD_REQUEST,
  USER_LOAD_SUCCESS,
  USER_LOGOUT_REQUEST,
  USER_LOGOUT_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_SIGNIN_REQUEST,
  USER_SIGNIN_SUCCESS,
  USER_SIGNUP_FAIL,
  USER_SIGNUP_REQUEST,
  USER_SIGNUP_SUCCESS,
  RESUME_ANALYZE_REQUEST,
  RESUME_ANALYZE_SUCCESS,
  RESUME_ANALYZE_FAIL,
  PREP_PLAN_REQUEST,
  PREP_PLAN_SUCCESS,
  PREP_PLAN_FAIL,
  ADMIN_STATS_REQUEST,
  ADMIN_STATS_SUCCESS,
  ADMIN_STATS_FAIL,
  ADMIN_JOBS_REQUEST,
  ADMIN_JOBS_SUCCESS,
  ADMIN_JOBS_FAIL,
  ADMIN_RECRUITERS_REQUEST,
  ADMIN_RECRUITERS_SUCCESS,
  ADMIN_RECRUITERS_FAIL,
  ADMIN_DELETE_RECRUITER_REQUEST,
  ADMIN_DELETE_RECRUITER_SUCCESS,
  ADMIN_DELETE_RECRUITER_FAIL,
  ADMIN_TOGGLE_JOB_REQUEST,
  ADMIN_TOGGLE_JOB_SUCCESS,
  ADMIN_TOGGLE_JOB_FAIL,
  ADMIN_DELETE_JOB_REQUEST,
  ADMIN_DELETE_JOB_SUCCESS,
  ADMIN_DELETE_JOB_FAIL,
  ADMIN_VERIFY_RECRUITER_REQUEST,
  ADMIN_VERIFY_RECRUITER_SUCCESS,
  ADMIN_VERIFY_RECRUITER_FAIL,
  ADMIN_APPLICATIONS_REQUEST,
  ADMIN_APPLICATIONS_SUCCESS,
  ADMIN_APPLICATIONS_FAIL,
  ADMIN_REPORTS_REQUEST,
  ADMIN_REPORTS_SUCCESS,
  ADMIN_REPORTS_FAIL,
  ADMIN_REPORT_UPDATE_REQUEST,
  ADMIN_REPORT_UPDATE_SUCCESS,
  ADMIN_REPORT_UPDATE_FAIL,
  ADMIN_REPORT_REMOVE_JOB_REQUEST,
  ADMIN_REPORT_REMOVE_JOB_SUCCESS,
  ADMIN_REPORT_REMOVE_JOB_FAIL,
  USER_SUBMIT_REPORT_REQUEST,
  USER_SUBMIT_REPORT_SUCCESS,
  USER_SUBMIT_REPORT_FAIL,
  ADMIN_FEEDBACK_REQUEST,
  ADMIN_FEEDBACK_SUCCESS,
  ADMIN_FEEDBACK_FAIL,
  ADMIN_FEEDBACK_UPDATE_SUCCESS,
  ADMIN_FEEDBACK_DELETE_SUCCESS,
  // Admin Users
  ADMIN_USERS_REQUEST,
  ADMIN_USERS_SUCCESS,
  ADMIN_USERS_FAIL,
  ADMIN_DEACTIVATE_USER_REQUEST,
  ADMIN_DEACTIVATE_USER_SUCCESS,
  ADMIN_DEACTIVATE_USER_FAIL,
  ADMIN_REACTIVATE_USER_REQUEST,
  ADMIN_REACTIVATE_USER_SUCCESS,
  ADMIN_REACTIVATE_USER_FAIL,
  ADMIN_SAFE_DELETE_USER_REQUEST,
  ADMIN_SAFE_DELETE_USER_SUCCESS,
  ADMIN_SAFE_DELETE_USER_FAIL,
  // Admin Recruiters
  ADMIN_DEACTIVATE_RECRUITER_REQUEST,
  ADMIN_DEACTIVATE_RECRUITER_SUCCESS,
  ADMIN_DEACTIVATE_RECRUITER_FAIL,
  ADMIN_REACTIVATE_RECRUITER_REQUEST,
  ADMIN_REACTIVATE_RECRUITER_SUCCESS,
  ADMIN_REACTIVATE_RECRUITER_FAIL,
  // Admin Jobs — Deleted / Restore
  ADMIN_DELETED_JOBS_REQUEST,
  ADMIN_DELETED_JOBS_SUCCESS,
  ADMIN_DELETED_JOBS_FAIL,
  ADMIN_RESTORE_JOB_REQUEST,
  ADMIN_RESTORE_JOB_SUCCESS,
  ADMIN_RESTORE_JOB_FAIL,
  // Admin Categories
  ADMIN_DELETE_CATEGORY_REQUEST,
  ADMIN_DELETE_CATEGORY_SUCCESS,
  ADMIN_DELETE_CATEGORY_FAIL,
  // Spam indicators
  ADMIN_SPAM_INDICATORS_REQUEST,
  ADMIN_SPAM_INDICATORS_SUCCESS,
  ADMIN_SPAM_INDICATORS_FAIL,
} from "../constants/userConstant";

export const userSignInAction = (user) => async (dispatch) => {
  dispatch({ type: USER_SIGNIN_REQUEST });
  try {
    const { data } = await axios.post("/api/signin", user);
    localStorage.setItem("userInfo", JSON.stringify(data));
    dispatch({
      type: USER_SIGNIN_SUCCESS,
      payload: data,
    });
    toast.success("Login Successfully!");
  } catch (error) {
    const message =
      error.response?.data?.error ||
      "Unable to reach the login service. Please try again.";
    dispatch({
      type: USER_SIGNIN_FAIL,
      payload: message,
    });
    toast.error(message);
    if (error.response?.data?.needsEmailVerification) {
      const email = encodeURIComponent(error.response.data.email || user.email);
      window.location.assign(`/verify-email?email=${email}&reason=unverified`);
    }
  }
};

// user sign up action
export const userSignUpAction = (user) => async (dispatch) => {
  dispatch({ type: USER_SIGNUP_REQUEST });
  try {
    const { data } = await axios.post("/api/signup", user);
    dispatch({
      type: USER_SIGNUP_SUCCESS,
      payload: data,
    });
    if (data.emailSent === false) {
      toast.warning(data.message);
    } else {
      toast.success("Registered! Check your email for the verification code.");
    }
    return data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      "Unable to reach the registration service. Please try again.";
    dispatch({
      type: USER_SIGNUP_FAIL,
      payload: message,
    });
    toast.error(message);
    return null;
  }
};

//log out action
export const userLogoutAction = () => async (dispatch) => {
  dispatch({ type: USER_LOGOUT_REQUEST });
  localStorage.removeItem("userInfo");
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  dispatch({ type: USER_LOGOUT_SUCCESS });
};

//user profile action
export const userProfileAction = () => async (dispatch) => {
  dispatch({ type: USER_LOAD_REQUEST });
  try {
    const { data } = await axios.get("/api/me");
    dispatch({
      type: USER_LOAD_SUCCESS,
      payload: { user: data.user || data },
    });
  } catch (error) {
    dispatch({
      type: USER_LOAD_FAIL,
      payload: error.response?.data?.error || "Unable to load profile",
    });
  }
};

//all user action
export const allUserAction = (page, pageSize) => async (dispatch) => {
  dispatch({ type: ALL_USER_LOAD_REQUEST });
  try {
    const { data } = await axios.get(
      `/api/allusers?pageNumber=${page}&pageSize=${pageSize}`,
    );
    dispatch({
      type: ALL_USER_LOAD_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ALL_USER_LOAD_FAIL,
      payload: error.response.data.error,
    });
  }
};
//allShowUserAction
export const allShowUserAction = () => async (dispatch) => {
  dispatch({ type: ALL_USER_LOAD_REQUEST });
  try {
    const { data } = await axios.get("/api/showallusers");
    dispatch({
      type: ALL_USER_LOAD_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ALL_USER_LOAD_FAIL,
      payload: error.response.data.error,
    });
  }
};
export const loadUserApplicationsAction = () => async (dispatch) => {
  dispatch({ type: USER_APPLICATIONS_LOAD_REQUEST });
  try {
    const { data } = await axios.get("/api/user/applications");
    dispatch({
      type: USER_APPLICATIONS_LOAD_SUCCESS,
      payload: data.applications || [],
    });
  } catch (error) {
    dispatch({
      type: USER_APPLICATIONS_LOAD_FAIL,
      payload: error.response?.data?.error || "Unable to load applications",
    });
  }
};

//user job apply action
export const userApplyJobAction = (Job) => async (dispatch) => {
  dispatch({ type: USER_APPLY_JOB_REQUEST });

  try {
    const { data } = await axios.post("/api/user/jobhistory", Job);

    dispatch({
      type: USER_APPLY_JOB_SUCCESS,
      payload: data,
    });
    await dispatch(userProfileAction());
    await dispatch(loadUserApplicationsAction());
    toast.success("Apply Successfully for this Job!");
  } catch (error) {
    dispatch({
      type: USER_APPLY_JOB_FAIL,
      payload: error.response?.data?.message || "Could not apply for this job",
    });
    toast.error(
      error.response?.data?.message || "Could not apply for this job",
    );
  }
};
//user Delete action
export const userDeleteAction = (id) => async (dispatch) => {
  dispatch({ type: USER_DELETE_REQUEST });

  try {
    const { data } = await axios.delete(`/api/admin/user/delete/${id}`);

    dispatch({
      type: USER_DELETE_SUCCESS,
      payload: data,
    });
    toast.success("User Deleted Successfully!");
  } catch (error) {
    dispatch({
      type: USER_DELETE_FAIL,
      payload: error.response.data.message,
    });
    toast.error(error.response.data.message);
  }
};

//Resetpassword
// export const resetPasswordAction = (email) => async (dispatch) => {
//   dispatch({ type: USER_FORGET_PASSWORD_REQUEST });
//   try {
//     const { data } = await axios.post("/api/forgetpassword", email);
//     console.log(data);
//     dispatch({
//       type: USER_FORGET_PASSWORD_SUCCESS,
//       payload: data,
//     });
//     toast.success("Register Successfully!");
//   } catch (error) {
//     dispatch({
//       type: USER_FORGET_PASSWORD_FAIL,
//       payload: error.response.data.error,
//     });
//     toast.error(error.response.data.error);
//   }
// };

//edit user
export function editUserAction(id, formdata) {
  return async function (dispatch) {
    dispatch({ type: EDIT_USER_REQUEST });
    try {
      console.log(formdata);
      console.log(id);
      const { data } = await axios.patch(`/api/user/edit/${id}`, formdata);
      console.log(data);
      dispatch({
        type: EDIT_USER_SUCCESS,
        payload: data,
      });
    } catch (error) {
      console.log(error);
      dispatch({
        type: EDIT_USER_FAIL,
        payload: error.response.data.error,
      });
    }
  };
}


// AI Resume Analyzer action — calls backend Gemini service
export const resumeAnalyzeAction = () => async (dispatch) => {
  dispatch({ type: RESUME_ANALYZE_REQUEST });
  try {
    const { data } = await axios.get("/api/user/resume-recommendations");
    dispatch({
      type: RESUME_ANALYZE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: RESUME_ANALYZE_FAIL,
      payload:
        error.response?.data?.error ||
        "Failed to analyze resume. Please try again.",
    });
  }
};

// Preparation Plan action — per job, keyed by jobId in reducer
export const prepPlanAction =
  (jobId, matchedSkills, missingSkills) => async (dispatch) => {
    dispatch({ type: PREP_PLAN_REQUEST, jobId });
    try {
      const { data } = await axios.post("/api/user/prepare", {
        jobId,
        matchedSkills,
        missingSkills,
      });
      dispatch({ type: PREP_PLAN_SUCCESS, jobId, payload: data.plan });
    } catch (error) {
      dispatch({
        type: PREP_PLAN_FAIL,
        jobId,
        payload:
          error.response?.data?.error ||
          "Failed to generate preparation plan. Please try again.",
      });
    }
  };

// ── Admin actions ────────────────────────────────────────────────────────────

export const adminStatsAction = () => async (dispatch) => {
  dispatch({ type: ADMIN_STATS_REQUEST });
  try {
    const { data } = await axios.get("/api/admin/stats");
    dispatch({ type: ADMIN_STATS_SUCCESS, payload: data.stats });
  } catch (error) {
    dispatch({ type: ADMIN_STATS_FAIL, payload: error.response?.data?.error || "Failed to load stats" });
  }
};

export const adminLoadJobsAction = () => async (dispatch) => {
  dispatch({ type: ADMIN_JOBS_REQUEST });
  try {
    const { data } = await axios.get("/api/admin/jobs");
    dispatch({ type: ADMIN_JOBS_SUCCESS, payload: data.jobs });
  } catch (error) {
    dispatch({
      type: ADMIN_JOBS_FAIL,
      payload: error.response?.data?.error || "Failed to load admin jobs",
    });
  }
};

export const adminLoadRecruitersAction = () => async (dispatch) => {
  dispatch({ type: ADMIN_RECRUITERS_REQUEST });
  try {
    const { data } = await axios.get("/api/admin/recruiters");
    dispatch({ type: ADMIN_RECRUITERS_SUCCESS, payload: data.recruiters });
  } catch (error) {
    dispatch({ type: ADMIN_RECRUITERS_FAIL, payload: error.response?.data?.error || "Failed to load recruiters" });
  }
};

export const adminDeleteRecruiterAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_DELETE_RECRUITER_REQUEST });
  try {
    await axios.delete(`/api/admin/recruiter/${id}`);
    dispatch({ type: ADMIN_DELETE_RECRUITER_SUCCESS, payload: id });
    toast.success("Recruiter deleted");
    dispatch(adminLoadRecruitersAction());
  } catch (error) {
    dispatch({ type: ADMIN_DELETE_RECRUITER_FAIL, payload: error.response?.data?.error || "Failed to delete recruiter" });
    toast.error(error.response?.data?.error || "Failed to delete recruiter");
  }
};

export const adminToggleJobAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_TOGGLE_JOB_REQUEST });
  try {
    const { data } = await axios.patch(`/api/admin/job/${id}/toggle`);
    dispatch({ type: ADMIN_TOGGLE_JOB_SUCCESS, payload: { id, available: data.available } });
    toast.success(data.message);
  } catch (error) {
    dispatch({ type: ADMIN_TOGGLE_JOB_FAIL, payload: error.response?.data?.error || "Failed to toggle job" });
    toast.error(error.response?.data?.error || "Failed to toggle job");
  }
};

export const adminDeleteJobAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_DELETE_JOB_REQUEST });
  try {
    await axios.delete(`/api/admin/job/${id}`);
    dispatch({ type: ADMIN_DELETE_JOB_SUCCESS, payload: id });
    toast.success("Job deleted");
  } catch (error) {
    dispatch({ type: ADMIN_DELETE_JOB_FAIL, payload: error.response?.data?.error || "Failed to delete job" });
    toast.error(error.response?.data?.error || "Failed to delete job");
  }
};

export const adminLoadApplicationsAction =
  ({ status = "", search = "" } = {}) =>
  async (dispatch) => {
    dispatch({ type: ADMIN_APPLICATIONS_REQUEST });
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (search) params.append("search", search);
      const { data } = await axios.get(
        `/api/admin/applications${params.toString() ? `?${params}` : ""}`,
      );
      dispatch({ type: ADMIN_APPLICATIONS_SUCCESS, payload: data.applications });
    } catch (error) {
      dispatch({
        type: ADMIN_APPLICATIONS_FAIL,
        payload: error.response?.data?.error || "Failed to load applications",
      });
    }
  };

// ── Report actions ────────────────────────────────────────────────────────────

export const userSubmitReportAction =
  ({ jobId, reason, details }) =>
  async (dispatch) => {
    dispatch({ type: USER_SUBMIT_REPORT_REQUEST });
    try {
      const { data } = await axios.post("/api/user/report", {
        jobId,
        reason,
        details,
      });
      dispatch({ type: USER_SUBMIT_REPORT_SUCCESS, payload: data.message });
      toast.success(data.message || "Report submitted successfully.");
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to submit report.";
      dispatch({ type: USER_SUBMIT_REPORT_FAIL, payload: msg });
      toast.error(msg);
    }
  };

export const adminLoadReportsAction =
  ({ status = "", search = "" } = {}) =>
  async (dispatch) => {
    dispatch({ type: ADMIN_REPORTS_REQUEST });
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (search) params.append("search", search);
      const { data } = await axios.get(
        `/api/admin/reports${params.toString() ? `?${params}` : ""}`,
      );
      dispatch({ type: ADMIN_REPORTS_SUCCESS, payload: data.reports });
    } catch (error) {
      dispatch({
        type: ADMIN_REPORTS_FAIL,
        payload: error.response?.data?.error || "Failed to load reports",
      });
    }
  };

export const adminUpdateReportStatusAction =
  (reportId, status, adminNote = "") =>
  async (dispatch) => {
    dispatch({ type: ADMIN_REPORT_UPDATE_REQUEST });
    try {
      const { data } = await axios.patch(
        `/api/admin/reports/${reportId}/status`,
        { status, adminNote },
      );
      dispatch({ type: ADMIN_REPORT_UPDATE_SUCCESS, payload: data.report });
      toast.success(`Report marked as ${status}.`);
    } catch (error) {
      const msg =
        error.response?.data?.error || "Failed to update report status.";
      dispatch({ type: ADMIN_REPORT_UPDATE_FAIL, payload: msg });
      toast.error(msg);
    }
  };

export const adminRemoveReportedJobAction =
  (reportId) => async (dispatch) => {
    dispatch({ type: ADMIN_REPORT_REMOVE_JOB_REQUEST });
    try {
      const { data } = await axios.delete(
        `/api/admin/reports/${reportId}/job`,
      );
      dispatch({ type: ADMIN_REPORT_REMOVE_JOB_SUCCESS, payload: reportId });
      toast.success(data.message || "Job removed and report resolved.");
    } catch (error) {
      const msg =
        error.response?.data?.error || "Failed to remove reported job.";
      dispatch({ type: ADMIN_REPORT_REMOVE_JOB_FAIL, payload: msg });
      toast.error(msg);
    }
  };

// ── Admin Feedback actions ────────────────────────────────────────────────────

export const adminLoadFeedbackAction =
  ({ role = "", status = "", search = "" } = {}) =>
  async (dispatch) => {
    dispatch({ type: ADMIN_FEEDBACK_REQUEST });
    try {
      const params = new URLSearchParams();
      if (role)   params.append("role",   role);
      if (status) params.append("status", status);
      if (search) params.append("search", search);
      const { data } = await axios.get(
        `/api/admin/feedback${params.toString() ? `?${params}` : ""}`,
      );
      dispatch({ type: ADMIN_FEEDBACK_SUCCESS, payload: data.feedback });
    } catch (error) {
      dispatch({
        type: ADMIN_FEEDBACK_FAIL,
        payload: error.response?.data?.error || "Failed to load feedback",
      });
    }
  };

export const adminUpdateFeedbackStatusAction =
  (id, status, adminNote = "") =>
  async (dispatch) => {
    try {
      const { data } = await axios.patch(`/api/admin/feedback/${id}/status`, {
        status,
        adminNote,
      });
      dispatch({ type: ADMIN_FEEDBACK_UPDATE_SUCCESS, payload: data.feedback });
      toast.success(`Feedback marked as ${status}.`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update feedback.");
    }
  };

export const adminDeleteFeedbackAction = (id) => async (dispatch) => {
  try {
    await axios.delete(`/api/admin/feedback/${id}`);
    dispatch({ type: ADMIN_FEEDBACK_DELETE_SUCCESS, payload: id });
    toast.success("Feedback deleted.");
  } catch (error) {
    toast.error(error.response?.data?.error || "Failed to delete feedback.");
  }
};

// ── Admin Users Management ────────────────────────────────────────────────────

// ── Admin Users Management actions ────────────────────────────────────────────

export const adminLoadUsersAction = () => async (dispatch) => {
  dispatch({ type: ADMIN_USERS_REQUEST });
  try {
    const { data } = await axios.get("/api/admin/users");
    dispatch({ type: ADMIN_USERS_SUCCESS, payload: data.users });
  } catch (error) {
    dispatch({ type: ADMIN_USERS_FAIL, payload: error.response?.data?.error || "Failed to load users" });
  }
};

export const adminDeactivateUserAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_DEACTIVATE_USER_REQUEST });
  try {
    await axios.patch(`/api/admin/user/${id}/deactivate`);
    dispatch({ type: ADMIN_DEACTIVATE_USER_SUCCESS, payload: id });
    toast.success("User deactivated");
  } catch (error) {
    const msg = error.response?.data?.error || "Failed to deactivate user";
    dispatch({ type: ADMIN_DEACTIVATE_USER_FAIL, payload: msg });
    toast.error(msg);
  }
};

export const adminReactivateUserAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_REACTIVATE_USER_REQUEST });
  try {
    await axios.patch(`/api/admin/user/${id}/reactivate`);
    dispatch({ type: ADMIN_REACTIVATE_USER_SUCCESS, payload: id });
    toast.success("User reactivated");
  } catch (error) {
    const msg = error.response?.data?.error || "Failed to reactivate user";
    dispatch({ type: ADMIN_REACTIVATE_USER_FAIL, payload: msg });
    toast.error(msg);
  }
};

export const adminSafeDeleteUserAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_SAFE_DELETE_USER_REQUEST });
  try {
    await axios.delete(`/api/admin/user/${id}`);
    dispatch({ type: ADMIN_SAFE_DELETE_USER_SUCCESS, payload: id });
    toast.success("User deleted");
  } catch (error) {
    const msg = error.response?.data?.error || "Failed to delete user";
    dispatch({ type: ADMIN_SAFE_DELETE_USER_FAIL, payload: msg });
    toast.error(msg);
  }
};

// ── Admin Recruiter Management actions ───────────────────────────────────────

export const adminDeactivateRecruiterAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_DEACTIVATE_RECRUITER_REQUEST });
  try {
    await axios.patch(`/api/admin/recruiter/${id}/deactivate`);
    dispatch({ type: ADMIN_DEACTIVATE_RECRUITER_SUCCESS, payload: id });
    toast.success("Recruiter deactivated and jobs unpublished");
    dispatch(adminLoadRecruitersAction());
  } catch (error) {
    const msg = error.response?.data?.error || "Failed to deactivate recruiter";
    dispatch({ type: ADMIN_DEACTIVATE_RECRUITER_FAIL, payload: msg });
    toast.error(msg);
  }
};

export const adminReactivateRecruiterAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_REACTIVATE_RECRUITER_REQUEST });
  try {
    await axios.patch(`/api/admin/recruiter/${id}/reactivate`);
    dispatch({ type: ADMIN_REACTIVATE_RECRUITER_SUCCESS, payload: id });
    toast.success("Recruiter reactivated");
    dispatch(adminLoadRecruitersAction());
  } catch (error) {
    const msg = error.response?.data?.error || "Failed to reactivate recruiter";
    dispatch({ type: ADMIN_REACTIVATE_RECRUITER_FAIL, payload: msg });
    toast.error(msg);
  }
};

export const adminVerifyRecruiterAction = (id, status) => async (dispatch) => {
  dispatch({ type: ADMIN_VERIFY_RECRUITER_REQUEST });
  try {
    await axios.patch(`/api/admin/recruiter/${id}/verify`, { status });
    dispatch({ type: ADMIN_VERIFY_RECRUITER_SUCCESS, payload: { id, status } });
    toast.success(`Recruiter ${status}`);
    dispatch(adminLoadRecruitersAction());
  } catch (error) {
    const msg = error.response?.data?.error || "Failed to update verification";
    dispatch({ type: ADMIN_VERIFY_RECRUITER_FAIL, payload: msg });
    toast.error(msg);
  }
};

// ── Admin Jobs — Deleted / Restore ───────────────────────────────────────────

export const adminLoadDeletedJobsAction = () => async (dispatch) => {
  dispatch({ type: ADMIN_DELETED_JOBS_REQUEST });
  try {
    const { data } = await axios.get("/api/admin/jobs/deleted");
    dispatch({ type: ADMIN_DELETED_JOBS_SUCCESS, payload: data.jobs });
  } catch (error) {
    dispatch({ type: ADMIN_DELETED_JOBS_FAIL, payload: error.response?.data?.error || "Failed to load deleted jobs" });
  }
};

export const adminRestoreJobAction = (id) => async (dispatch) => {
  dispatch({ type: ADMIN_RESTORE_JOB_REQUEST });
  try {
    await axios.patch(`/api/admin/job/${id}/restore`);
    dispatch({ type: ADMIN_RESTORE_JOB_SUCCESS, payload: id });
    toast.success("Job restored");
  } catch (error) {
    const msg = error.response?.data?.error || "Failed to restore job";
    dispatch({ type: ADMIN_RESTORE_JOB_FAIL, payload: msg });
    toast.error(msg);
  }
};

// ── Admin Categories ──────────────────────────────────────────────────────────

export const adminDeleteCategoryAction = (id, reassignTo) => async (dispatch) => {
  dispatch({ type: ADMIN_DELETE_CATEGORY_REQUEST });
  const url = reassignTo
    ? `/api/admin/category/${id}?reassignTo=${reassignTo}`
    : `/api/admin/category/${id}`;
  try {
    const { data } = await axios.delete(url);
    dispatch({ type: ADMIN_DELETE_CATEGORY_SUCCESS, payload: id });
    toast.success(data.message || "Category deleted");
    return { success: true };
  } catch (error) {
    const res = error.response;
    const msg = res?.data?.message || res?.data?.error || "Failed to delete category";
    dispatch({ type: ADMIN_DELETE_CATEGORY_FAIL, payload: msg });
    // Return structured error so UI can show the reassign prompt
    return { success: false, linkedCount: res?.data?.linkedCount, message: msg };
  }
};

// ── Spam indicators ───────────────────────────────────────────────────────────

export const adminLoadSpamIndicatorsAction = () => async (dispatch) => {
  dispatch({ type: ADMIN_SPAM_INDICATORS_REQUEST });
  try {
    const { data } = await axios.get("/api/admin/spam-indicators");
    dispatch({ type: ADMIN_SPAM_INDICATORS_SUCCESS, payload: data.indicators });
  } catch (error) {
    dispatch({ type: ADMIN_SPAM_INDICATORS_FAIL, payload: error.response?.data?.error || "Failed to load spam indicators" });
  }
};
