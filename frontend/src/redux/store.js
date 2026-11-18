import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "@redux-devtools/extension";
import {
  adminJobReducer,
  deleteAjobReducer,
  editJobReducer,
  loadJobReducer,
  loadJobSingleReducer,
  registerAjobReducer,
  updateJobStatusReducer,
  useApplyLoadJobReducer,
} from "./reducers/jobReducer";
import {
  AdminLoadJobTypeReducer,
  createJobTypeReducer,
  editJobTypeReducer,
  loadJobTypeReducer,
} from "./reducers/jobTypeReducer";
import {
  allUserReducer,
  editUserReducer,
  resetPasswordReducer,
  userApplyJobReducer,
  userApplicationsReducer,
  userReducerLogout,
  userReducerProfile,
  userReducerSignIn,
  userReducerSignUp,
  resumeAnalyzeReducer,
  prepPlanReducer,
  adminStatsReducer,
  adminJobsReducer,
  adminRecruitersReducer,
  adminToggleJobReducer,
  adminDeleteJobReducer,
  adminApplicationsReducer,
  adminReportsReducer,
  userSubmitReportReducer,
  adminFeedbackReducer,
  // Phase 2 new reducers
  adminUsersReducer,
  adminRecruiterStatusReducer,
  adminDeletedJobsReducer,
  adminRestoreJobReducer,
  adminDeleteCategoryReducer,
  adminSpamIndicatorsReducer,
} from "./reducers/userReducer";
import { modeReducer } from "./reducers/themeModeReducer";
import { deleteJobTypeReducer } from "./reducers/jobTypeReducer";
import { generalReducer } from "./reducers/generalReducer";
import { savedJobReducer } from "./reducers/savedJobReducer";

//combine reducers
const reducer = combineReducers({
  loadJobs: loadJobReducer,
  jobTypeAll: loadJobTypeReducer,
  signIn: userReducerSignIn,
  logOut: userReducerLogout,
  userprofile: userReducerProfile,
  singleJob: loadJobSingleReducer,
  userJobApplication: userApplyJobReducer,
  userApplications: userApplicationsReducer,
  allUsers: allUserReducer,
  signUp: userReducerSignUp,
  mode: modeReducer,
  registerJob: registerAjobReducer,
  createJobType: createJobTypeReducer,
  deleteJobType: deleteJobTypeReducer,
  deleteJob: deleteAjobReducer,
  adminCreateJob: adminJobReducer,
  editJob: editJobReducer,
  general: generalReducer,
  jobType: AdminLoadJobTypeReducer,
  editJobType: editJobTypeReducer,
  resetPassword: resetPasswordReducer,
  editUser: editUserReducer,
  applyByUser: useApplyLoadJobReducer,
  updateStatus: updateJobStatusReducer,
  savedJobs: savedJobReducer,
  resumeAnalyze: resumeAnalyzeReducer,
  prepPlan: prepPlanReducer,
  adminStats: adminStatsReducer,
  adminJobs: adminJobsReducer,
  adminRecruiters: adminRecruitersReducer,
  adminToggleJob: adminToggleJobReducer,
  adminDeleteJob: adminDeleteJobReducer,
  adminApplications: adminApplicationsReducer,
  adminReports: adminReportsReducer,
  userSubmitReport: userSubmitReportReducer,
  adminFeedback: adminFeedbackReducer,
  // Phase 2
  adminUsers: adminUsersReducer,
  adminRecruiterStatus: adminRecruiterStatusReducer,
  adminDeletedJobs: adminDeletedJobsReducer,
  adminRestoreJob: adminRestoreJobReducer,
  adminDeleteCategory: adminDeleteCategoryReducer,
  adminSpamIndicators: adminSpamIndicatorsReducer,
});

//initial state
let initialState = {
  signIn: {
    userInfo: localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null,
  },
  mode: {
    mode: "light",
  },
};
const middleware = [thunk];
const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware)),
);

export default store;
