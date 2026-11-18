import {
  ALL_USER_LOAD_FAIL,
  ALL_USER_LOAD_REQUEST,
  ALL_USER_LOAD_RESET,
  ALL_USER_LOAD_SUCCESS,
  EDIT_USER_FAIL,
  EDIT_USER_REQUEST,
  EDIT_USER_RESET,
  EDIT_USER_SUCCESS,
  USER_APPLY_JOB_FAIL,
  USER_APPLY_JOB_REQUEST,
  USER_APPLY_JOB_RESET,
  USER_APPLY_JOB_SUCCESS,
  USER_APPLICATIONS_LOAD_FAIL,
  USER_APPLICATIONS_LOAD_REQUEST,
  USER_APPLICATIONS_LOAD_RESET,
  USER_APPLICATIONS_LOAD_SUCCESS,
  USER_FORGET_PASSWORD_FAIL,
  USER_FORGET_PASSWORD_REQUEST,
  USER_FORGET_PASSWORD_RESET,
  USER_FORGET_PASSWORD_SUCCESS,
  USER_LOAD_FAIL,
  USER_LOAD_REQUEST,
  USER_LOAD_RESET,
  USER_LOAD_SUCCESS,
  USER_LOGOUT_FAIL,
  USER_LOGOUT_REQUEST,
  USER_LOGOUT_RESET,
  USER_LOGOUT_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_SIGNIN_REQUEST,
  USER_SIGNIN_RESET,
  USER_SIGNIN_SUCCESS,
  USER_SIGNUP_FAIL,
  USER_SIGNUP_REQUEST,
  USER_SIGNUP_RESET,
  USER_SIGNUP_SUCCESS,
  RESUME_ANALYZE_REQUEST,
  RESUME_ANALYZE_SUCCESS,
  RESUME_ANALYZE_FAIL,
  RESUME_ANALYZE_RESET,
  PREP_PLAN_REQUEST,
  PREP_PLAN_SUCCESS,
  PREP_PLAN_FAIL,
  PREP_PLAN_RESET,
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
  ADMIN_APPLICATIONS_REQUEST,
  ADMIN_APPLICATIONS_SUCCESS,
  ADMIN_APPLICATIONS_FAIL,
  ADMIN_REPORTS_REQUEST,
  ADMIN_REPORTS_SUCCESS,
  ADMIN_REPORTS_FAIL,
  ADMIN_REPORT_UPDATE_SUCCESS,
  ADMIN_REPORT_REMOVE_JOB_SUCCESS,
  USER_SUBMIT_REPORT_REQUEST,
  USER_SUBMIT_REPORT_SUCCESS,
  USER_SUBMIT_REPORT_FAIL,
  USER_SUBMIT_REPORT_RESET,
  ADMIN_FEEDBACK_REQUEST,
  ADMIN_FEEDBACK_SUCCESS,
  ADMIN_FEEDBACK_FAIL,
  ADMIN_FEEDBACK_UPDATE_SUCCESS,
  ADMIN_FEEDBACK_DELETE_SUCCESS,
  // New Phase 2 constants
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
  ADMIN_DEACTIVATE_RECRUITER_REQUEST,
  ADMIN_DEACTIVATE_RECRUITER_SUCCESS,
  ADMIN_DEACTIVATE_RECRUITER_FAIL,
  ADMIN_REACTIVATE_RECRUITER_REQUEST,
  ADMIN_REACTIVATE_RECRUITER_SUCCESS,
  ADMIN_REACTIVATE_RECRUITER_FAIL,
  ADMIN_VERIFY_RECRUITER_REQUEST,
  ADMIN_VERIFY_RECRUITER_SUCCESS,
  ADMIN_VERIFY_RECRUITER_FAIL,
  ADMIN_DELETED_JOBS_REQUEST,
  ADMIN_DELETED_JOBS_SUCCESS,
  ADMIN_DELETED_JOBS_FAIL,
  ADMIN_RESTORE_JOB_REQUEST,
  ADMIN_RESTORE_JOB_SUCCESS,
  ADMIN_RESTORE_JOB_FAIL,
  ADMIN_DELETE_CATEGORY_REQUEST,
  ADMIN_DELETE_CATEGORY_SUCCESS,
  ADMIN_DELETE_CATEGORY_FAIL,
  ADMIN_SPAM_INDICATORS_REQUEST,
  ADMIN_SPAM_INDICATORS_SUCCESS,
  ADMIN_SPAM_INDICATORS_FAIL,
} from "../constants/userConstant";

export const userReducerSignIn = (state = {}, action) => {
  switch (action.type) {
    case USER_LOGOUT_REQUEST:
    case USER_LOGOUT_SUCCESS:
      return { loading: false, userInfo: null, isAuthenticated: false };
    case USER_SIGNIN_REQUEST:
      return { loading: true, userInfo: null, isAuthenticated: false };
    case USER_SIGNIN_SUCCESS:
      return { loading: false, userInfo: action.payload, isAuthenticated: true };
    case USER_SIGNIN_FAIL:
      return { loading: false, userInfo: null, isAuthenticated: false, error: action.payload };
    case USER_SIGNIN_RESET:
      return {};
    default:
      return state;
  }
};

export const userReducerSignUp = (state = {}, action) => {
  switch (action.type) {
    case USER_SIGNUP_REQUEST:
      return { loading: true };
    case USER_SIGNUP_SUCCESS:
      return { loading: false, userSignUp: action.payload };
    case USER_SIGNUP_FAIL:
      return { loading: false, error: action.payload };
    case USER_SIGNUP_RESET:
      return {};
    default:
      return state;
  }
};

export const userReducerLogout = (state = {}, action) => {
  switch (action.type) {
    case USER_LOGOUT_REQUEST:
      return { loading: true };
    case USER_LOGOUT_SUCCESS:
      return { loading: false, user: action.payload };
    case USER_LOGOUT_FAIL:
      return { loading: false, error: action.payload };
    case USER_LOGOUT_RESET:
      return {};
    default:
      return state;
  }
};

export const userReducerProfile = (state = { user: null }, action) => {
  switch (action.type) {
    case USER_LOGOUT_REQUEST:
    case USER_LOAD_REQUEST:
      return { loading: true, user: null };
    case USER_LOAD_SUCCESS:
      return { loading: false, user: action.payload.user };
    case USER_LOAD_FAIL:
      return { loading: false, user: null, error: action.payload };
    case USER_LOAD_RESET:
      return {};
    default:
      return state;
  }
};

export const userApplyJobReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_APPLY_JOB_REQUEST:
      return { loading: true };
    case USER_APPLY_JOB_SUCCESS:
      return { loading: false, userJob: action.payload };
    case USER_APPLY_JOB_FAIL:
      return { loading: false, error: action.payload };
    case USER_APPLY_JOB_RESET:
      return {};
    default:
      return state;
  }
};

export const userApplicationsReducer = (state = { applications: [] }, action) => {
  switch (action.type) {
    case USER_APPLICATIONS_LOAD_REQUEST:
      return { loading: true, applications: [] };
    case USER_APPLICATIONS_LOAD_SUCCESS:
      return { loading: false, applications: action.payload };
    case USER_APPLICATIONS_LOAD_FAIL:
      return { loading: false, applications: [], error: action.payload };
    case USER_APPLICATIONS_LOAD_RESET:
      return { applications: [] };
    default:
      return state;
  }
};

export const allUserReducer = (state = { users: [] }, action) => {
  switch (action.type) {
    case ALL_USER_LOAD_REQUEST:
      return { loading: true, users: [] };
    case ALL_USER_LOAD_SUCCESS:
      return { loading: false, users: action.payload.users };
    case ALL_USER_LOAD_FAIL:
      return { loading: false, users: [], error: action.payload };
    case ALL_USER_LOAD_RESET:
      return {};
    default:
      return state;
  }
};

export const resetPasswordReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_FORGET_PASSWORD_REQUEST:
      return { loading: true };
    case USER_FORGET_PASSWORD_SUCCESS:
      return { loading: false, userJob: action.payload };
    case USER_FORGET_PASSWORD_FAIL:
      return { loading: false, error: action.payload };
    case USER_FORGET_PASSWORD_RESET:
      return {};
    default:
      return state;
  }
};

export const editUserReducer = (state = {}, action) => {
  switch (action.type) {
    case EDIT_USER_REQUEST:
      return { loading: true };
    case EDIT_USER_SUCCESS:
      return { loading: false, success: action.payload.success, jobs: action.payload };
    case EDIT_USER_FAIL:
      return { loading: false, error: action.payload };
    case EDIT_USER_RESET:
      return {};
    default:
      return state;
  }
};

export const resumeAnalyzeReducer = (
  state = { resumeProfile: null, recommendations: [] },
  action
) => {
  switch (action.type) {
    case RESUME_ANALYZE_REQUEST:
      return { loading: true, resumeProfile: null, recommendations: [] };
    case RESUME_ANALYZE_SUCCESS:
      return {
        loading: false,
        resumeProfile: action.payload.resumeProfile,
        recommendations: action.payload.recommendations,
      };
    case RESUME_ANALYZE_FAIL:
      return { loading: false, resumeProfile: null, recommendations: [], error: action.payload };
    case RESUME_ANALYZE_RESET:
      return { resumeProfile: null, recommendations: [] };
    default:
      return state;
  }
};

// Keyed by jobId so each card has independent loading/plan/error state
export const prepPlanReducer = (state = {}, action) => {
  switch (action.type) {
    case PREP_PLAN_REQUEST:
      return { ...state, [action.jobId]: { loading: true, plan: null, error: null } };
    case PREP_PLAN_SUCCESS:
      return { ...state, [action.jobId]: { loading: false, plan: action.payload, error: null } };
    case PREP_PLAN_FAIL:
      return { ...state, [action.jobId]: { loading: false, plan: null, error: action.payload } };
    case PREP_PLAN_RESET:
      return {};
    default:
      return state;
  }
};

// ── Admin reducers ────────────────────────────────────────────────────────────

export const adminStatsReducer = (state = { stats: null }, action) => {
  switch (action.type) {
    case ADMIN_STATS_REQUEST:
      return { loading: true, stats: null };
    case ADMIN_STATS_SUCCESS:
      return { loading: false, stats: action.payload };
    case ADMIN_STATS_FAIL:
      return { loading: false, stats: null, error: action.payload };
    default:
      return state;
  }
};

export const adminJobsReducer = (state = { jobs: [] }, action) => {
  switch (action.type) {
    case ADMIN_JOBS_REQUEST:
      return { loading: true, jobs: [] };
    case ADMIN_JOBS_SUCCESS:
      return { loading: false, jobs: action.payload };
    case ADMIN_JOBS_FAIL:
      return { loading: false, jobs: [], error: action.payload };
    default:
      return state;
  }
};

export const adminRecruitersReducer = (state = { recruiters: [] }, action) => {
  switch (action.type) {
    case ADMIN_RECRUITERS_REQUEST:
      return { loading: true, recruiters: [] };
    case ADMIN_RECRUITERS_SUCCESS:
      return { loading: false, recruiters: action.payload };
    case ADMIN_RECRUITERS_FAIL:
      return { loading: false, recruiters: [], error: action.payload };
    case ADMIN_DELETE_RECRUITER_REQUEST:
      return { ...state, deleting: true };
    case ADMIN_DELETE_RECRUITER_SUCCESS:
      return {
        ...state,
        deleting: false,
        recruiters: state.recruiters.filter((r) => r._id !== action.payload),
      };
    case ADMIN_DELETE_RECRUITER_FAIL:
      return { ...state, deleting: false, error: action.payload };
    default:
      return state;
  }
};

export const adminToggleJobReducer = (state = {}, action) => {
  switch (action.type) {
    case ADMIN_TOGGLE_JOB_REQUEST:
      return { loading: true };
    case ADMIN_TOGGLE_JOB_SUCCESS:
      return { loading: false, result: action.payload };
    case ADMIN_TOGGLE_JOB_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const adminDeleteJobReducer = (state = {}, action) => {
  switch (action.type) {
    case ADMIN_DELETE_JOB_REQUEST:
      return { loading: true };
    case ADMIN_DELETE_JOB_SUCCESS:
      return { loading: false, deletedId: action.payload };
    case ADMIN_DELETE_JOB_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const adminApplicationsReducer = (
  state = { applications: [] },
  action,
) => {
  switch (action.type) {
    case ADMIN_APPLICATIONS_REQUEST:
      return { loading: true, applications: [] };
    case ADMIN_APPLICATIONS_SUCCESS:
      return { loading: false, applications: action.payload };
    case ADMIN_APPLICATIONS_FAIL:
      return { loading: false, applications: [], error: action.payload };
    default:
      return state;
  }
};

// ── Report reducers ───────────────────────────────────────────────────────────

export const adminReportsReducer = (state = { reports: [] }, action) => {
  switch (action.type) {
    case ADMIN_REPORTS_REQUEST:
      return { loading: true, reports: [] };
    case ADMIN_REPORTS_SUCCESS:
      return { loading: false, reports: action.payload };
    case ADMIN_REPORTS_FAIL:
      return { loading: false, reports: [], error: action.payload };
    // Optimistically update the changed report in-place
    case ADMIN_REPORT_UPDATE_SUCCESS:
      return {
        ...state,
        reports: state.reports.map((r) =>
          r._id === action.payload._id ? action.payload : r,
        ),
      };
    case ADMIN_REPORT_REMOVE_JOB_SUCCESS:
      return {
        ...state,
        reports: state.reports.map((r) =>
          r._id === action.payload
            ? { ...r, status: "resolved" }
            : r,
        ),
      };
    default:
      return state;
  }
};

export const userSubmitReportReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_SUBMIT_REPORT_REQUEST:
      return { loading: true };
    case USER_SUBMIT_REPORT_SUCCESS:
      return { loading: false, success: true, message: action.payload };
    case USER_SUBMIT_REPORT_FAIL:
      return { loading: false, error: action.payload };
    case USER_SUBMIT_REPORT_RESET:
      return {};
    default:
      return state;
  }
};

export const adminFeedbackReducer = (state = { feedback: [] }, action) => {
  switch (action.type) {
    case ADMIN_FEEDBACK_REQUEST:
      return { loading: true, feedback: [] };
    case ADMIN_FEEDBACK_SUCCESS:
      return { loading: false, feedback: action.payload };
    case ADMIN_FEEDBACK_FAIL:
      return { loading: false, feedback: [], error: action.payload };
    case ADMIN_FEEDBACK_UPDATE_SUCCESS:
      return {
        ...state,
        feedback: state.feedback.map((f) =>
          f._id === action.payload._id
            ? { ...f, status: action.payload.status, adminNote: action.payload.adminNote, reviewedAt: action.payload.reviewedAt }
            : f,
        ),
      };
    case ADMIN_FEEDBACK_DELETE_SUCCESS:
      return {
        ...state,
        feedback: state.feedback.filter((f) => f._id !== action.payload),
      };
    default:
      return state;
  }
};

// ── Admin Users reducer ───────────────────────────────────────────────────────
export const adminUsersReducer = (state = { users: [] }, action) => {
  switch (action.type) {
    case ADMIN_USERS_REQUEST:
      return { loading: true, users: [] };
    case ADMIN_USERS_SUCCESS:
      return { loading: false, users: action.payload };
    case ADMIN_USERS_FAIL:
      return { loading: false, users: [], error: action.payload };
    // Optimistic updates — patch isActive in-place so the UI reflects changes without a refetch
    case ADMIN_DEACTIVATE_USER_SUCCESS:
      return {
        ...state,
        users: state.users.map((u) =>
          u._id === action.payload ? { ...u, isActive: false } : u,
        ),
      };
    case ADMIN_REACTIVATE_USER_SUCCESS:
      return {
        ...state,
        users: state.users.map((u) =>
          u._id === action.payload ? { ...u, isActive: true } : u,
        ),
      };
    case ADMIN_SAFE_DELETE_USER_SUCCESS:
      return {
        ...state,
        users: state.users.filter((u) => u._id !== action.payload),
      };
    default:
      return state;
  }
};

// ── Admin Recruiters — deactivate/reactivate/verify patch-in-place ────────────
// (the base adminRecruitersReducer already handles load/delete;
//  we extend it by patching the list in-place for status changes)
export const adminRecruiterStatusReducer = (state = {}, action) => {
  switch (action.type) {
    case ADMIN_DEACTIVATE_RECRUITER_REQUEST:
    case ADMIN_REACTIVATE_RECRUITER_REQUEST:
    case ADMIN_VERIFY_RECRUITER_REQUEST:
      return { ...state, pending: true, error: null };
    case ADMIN_DEACTIVATE_RECRUITER_SUCCESS:
    case ADMIN_REACTIVATE_RECRUITER_SUCCESS:
    case ADMIN_VERIFY_RECRUITER_SUCCESS:
      return { pending: false };
    case ADMIN_DEACTIVATE_RECRUITER_FAIL:
    case ADMIN_REACTIVATE_RECRUITER_FAIL:
    case ADMIN_VERIFY_RECRUITER_FAIL:
      return { pending: false, error: action.payload };
    default:
      return state;
  }
};

// ── Admin Deleted Jobs reducer ────────────────────────────────────────────────
export const adminDeletedJobsReducer = (state = { jobs: [] }, action) => {
  switch (action.type) {
    case ADMIN_DELETED_JOBS_REQUEST:
      return { loading: true, jobs: [] };
    case ADMIN_DELETED_JOBS_SUCCESS:
      return { loading: false, jobs: action.payload };
    case ADMIN_DELETED_JOBS_FAIL:
      return { loading: false, jobs: [], error: action.payload };
    case ADMIN_RESTORE_JOB_SUCCESS:
      return {
        ...state,
        jobs: state.jobs.filter((j) => j._id !== action.payload),
      };
    default:
      return state;
  }
};

export const adminRestoreJobReducer = (state = {}, action) => {
  switch (action.type) {
    case ADMIN_RESTORE_JOB_REQUEST:
      return { loading: true };
    case ADMIN_RESTORE_JOB_SUCCESS:
      return { loading: false, restoredId: action.payload };
    case ADMIN_RESTORE_JOB_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// ── Admin Category Delete reducer ─────────────────────────────────────────────
export const adminDeleteCategoryReducer = (state = {}, action) => {
  switch (action.type) {
    case ADMIN_DELETE_CATEGORY_REQUEST:
      return { loading: true };
    case ADMIN_DELETE_CATEGORY_SUCCESS:
      return { loading: false, deletedId: action.payload };
    case ADMIN_DELETE_CATEGORY_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// ── Spam Indicators reducer ───────────────────────────────────────────────────
export const adminSpamIndicatorsReducer = (state = { indicators: [] }, action) => {
  switch (action.type) {
    case ADMIN_SPAM_INDICATORS_REQUEST:
      return { loading: true, indicators: [] };
    case ADMIN_SPAM_INDICATORS_SUCCESS:
      return { loading: false, indicators: action.payload };
    case ADMIN_SPAM_INDICATORS_FAIL:
      return { loading: false, indicators: [], error: action.payload };
    default:
      return state;
  }
};
