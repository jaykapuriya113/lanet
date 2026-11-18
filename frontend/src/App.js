import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProSidebarProvider } from "react-pro-sidebar";
import LogIn from "./pages/LogIn";
import UserDashboard from "./pages/user/UserDashboard";
import CompleteProfile from "./pages/user/CompleteProfile";
import UserRoute from "./component/UserRoute";
import AdminRoute from "./component/AdminRoute";
import Layout from "./pages/global/Layout";
import UserJobsHistory from "./pages/user/UserJobsHistory";
import SavedJobs from "./pages/user/SavedJobs";
import UserInfoDashboard from "./pages/user/UserInfoDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SingleJob from "./pages/SingleJob";
import DashJobs from "./pages/admin/DashJobs";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import DashCategory from "./pages/admin/DashCategory";
import DashCreateJob from "./pages/admin/DashCreateJob";
import DashCreateCategory from "./pages/admin/DashCreateCategory";
import { createTheme } from "@mui/material/styles";
import { themeColors } from "./theme";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import ResetPassword from "./pages/ResetPassword";
import ResetPassword1 from "./pages/ResetPassword1";
import YoutubeVideo from "./component/youtube/YoutubeViedo";
import { CometChat } from "@cometchat-pro/chat";
import AdminChat from "./pages/admin/AdminChat";
import UserChat from "./pages/user/UserChat";
import MainAdminRoute from "./component/MainAdmin";
import DashAllUsers from "./component/mainadmin/DashUser";
import DashAdminInfo from "./component/mainadmin/DashAdminInfo";
import DashAllJobs from "./component/mainadmin/DashAllJobs";
import DashAllCategory from "./component/mainadmin/DashAllCategory";
import AdminStats from "./component/mainadmin/AdminStats";
import AdminRecruiters from "./component/mainadmin/AdminRecruiters";
import AdminApplications from "./component/mainadmin/AdminApplications";
import AdminReports from "./component/mainadmin/AdminReports";
import AdminFeedback from "./component/mainadmin/AdminFeedback";
import RecruiterDashboard from "./pages/admin/RecruiterDashboard";
import DashUsers from "./pages/admin/DashUsers";
import ApplicantReview from "./pages/admin/ApplicantReview";
import SuitableCandidates from "./pages/admin/SuitableCandidates";
import PlatformFeedback from "./pages/admin/PlatformFeedback";
import ResumeRecommendations from "./pages/user/ResumeRecommendations";
import UserPlatformFeedback from "./pages/user/UserPlatformFeedback";
import JobResults from "./pages/JobResults";
import AboutUs from "./pages/AboutUs";
import HelpFAQ from "./pages/HelpFAQ";

//HOC
const UserDashboardHOC = Layout(UserDashboard);
const CompleteProfileHOC = Layout(CompleteProfile);
const UserJobsHistoryHOC = Layout(UserJobsHistory);
const SavedJobsHOC = Layout(SavedJobs);
const UserInfoDashboardHOC = Layout(UserInfoDashboard);
const AdminDashboardHOC = Layout(AdminDashboard);
const DashJobsHOC = Layout(DashJobs);
const DashCategoryHOC = Layout(DashCategory);
const DashCreateJobHOC = Layout(DashCreateJob);
const DashCreateCategoryHOC = Layout(DashCreateCategory);
const DashAdminChatHOC = Layout(AdminChat);
const DashUSerChatHOC = Layout(UserChat);
const DashAdminInfoHOC = Layout(DashAdminInfo);
const DashAllJobsHOC = Layout(DashAllJobs);
const DashAllCategoryHOC = Layout(DashAllCategory);
const DashAllUsersHOC = Layout(DashAllUsers);
const AdminStatsHOC = Layout(AdminStats);
const AdminRecruitersHOC = Layout(AdminRecruiters);
const AdminApplicationsHOC = Layout(AdminApplications);
const AdminReportsHOC   = Layout(AdminReports);
const AdminFeedbackHOC  = Layout(AdminFeedback);
const RecruiterDashboardHOC = Layout(RecruiterDashboard);
const DashUsersHOC = Layout(DashUsers);
const ApplicantReviewHOC = Layout(ApplicantReview);
const SuitableCandidatesHOC = Layout(SuitableCandidates);
const PlatformFeedbackHOC = Layout(PlatformFeedback);
const ResumeRecommendationsHOC = Layout(ResumeRecommendations);
const UserPlatformFeedbackHOC = Layout(UserPlatformFeedback);

const appID = process.env.REACT_APP_COMETCHAT_APP_ID;
const region = process.env.REACT_APP_COMETCHAT_REGION;
const appSetting = new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(region)
  .build();
CometChat.init(appID, appSetting).then(
  () => {
    console.log("Initialization completed successfully");
  },
  (error) => {
    console.log("Initialization failed with error:", error);
  },
);

const App = () => {
  const { mode } = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeColors(mode)), [mode]);

  return (
    <>
      <ToastContainer />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ProSidebarProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<JobResults />} />
              <Route path="/search/location/:location" element={<Home />} />
              <Route path="/search/:keyword/location/:location" element={<Home />} />
              <Route path="/search/:keyword" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<LogIn />} />
              <Route path="/admin/login" element={<LogIn adminLogin />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/help" element={<HelpFAQ />} />
              <Route path="/search" element={<YoutubeVideo />} />
              <Route path="/job/:id" element={<SingleJob />} />
              <Route
                path="/recruiter/dashboard"
                element={
                  <AdminRoute>
                    <RecruiterDashboardHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/info"
                element={
                  <AdminRoute>
                    <AdminDashboardHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/jobs"
                element={
                  <AdminRoute>
                    <DashJobsHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/category"
                element={
                  <AdminRoute>
                    <DashCategoryHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/job/create"
                element={
                  <AdminRoute>
                    <DashCreateJobHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/category/create"
                element={
                  <AdminRoute>
                    <DashCreateCategoryHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/chat"
                element={
                  <AdminRoute>
                    <DashAdminChatHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/platform-feedback"
                element={
                  <AdminRoute>
                    <PlatformFeedbackHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/users"
                element={
                  <AdminRoute>
                    <DashUsersHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/application/:applicationId"
                element={
                  <AdminRoute>
                    <ApplicantReviewHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/recruiter/suitable-candidates"
                element={
                  <AdminRoute>
                    <SuitableCandidatesHOC />
                  </AdminRoute>
                }
              />
              <Route
                path="/mainadmin"
                element={
                  <MainAdminRoute>
                    <DashAllUsersHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/info"
                element={
                  <MainAdminRoute>
                    <DashAdminInfoHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/alljobs"
                element={
                  <MainAdminRoute>
                    <DashAllJobsHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/allcategory"
                element={
                  <MainAdminRoute>
                    <DashAllCategoryHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/stats"
                element={
                  <MainAdminRoute>
                    <AdminStatsHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/recruiters"
                element={
                  <MainAdminRoute>
                    <AdminRecruitersHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/applications"
                element={
                  <MainAdminRoute>
                    <AdminApplicationsHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/reports"
                element={
                  <MainAdminRoute>
                    <AdminReportsHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/mainadmin/feedback"
                element={
                  <MainAdminRoute>
                    <AdminFeedbackHOC />
                  </MainAdminRoute>
                }
              />
              <Route
                path="/user/dashboard"
                element={
                  <UserRoute>
                    <UserDashboardHOC />
                  </UserRoute>
                }
              />
              <Route
                path="/user/complete-profile"
                element={
                  <UserRoute>
                    <CompleteProfileHOC />
                  </UserRoute>
                }
              />
              <Route
                path="/user/jobs"
                element={
                  <UserRoute>
                    <UserJobsHistoryHOC />
                  </UserRoute>
                }
              />
              <Route
                path="/user/feedback"
                element={
                  <UserRoute>
                    <UserPlatformFeedbackHOC />
                  </UserRoute>
                }
              />
              <Route
                path="/user/saved-jobs"
                element={
                  <UserRoute>
                    <SavedJobsHOC />
                  </UserRoute>
                }
              />
              <Route
                path="/user/info"
                element={
                  <UserRoute>
                    <UserInfoDashboardHOC />
                  </UserRoute>
                }
              />
              <Route
                path="/user/chat"
                element={
                  <UserRoute>
                    <DashUSerChatHOC />
                  </UserRoute>
                }
              />
              <Route
                path="/user/resume-recommendations"
                element={
                  <UserRoute>
                    <ResumeRecommendationsHOC />
                  </UserRoute>
                }
              />
              <Route path="/user/ResetPassword" element={<ResetPassword />} />
              <Route
                path="/user/resetPassword/:token"
                element={<ResetPassword1 />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProSidebarProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
