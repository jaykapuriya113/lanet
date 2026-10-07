import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { IconButton, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import {
  removeSavedJobAction,
  saveJobAction,
} from "../redux/actions/savedJobAction";
import { savedJobsLoadAction } from "../redux/actions/savedJobAction";

const SaveJobButton = ({ jobId, size = "medium" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.signIn);
  const {
    savedJobs = [],
    savingJobId,
    loaded,
    loading,
    loadedUserId,
  } = useSelector((state) => state.savedJobs);
  const userId = userInfo?.role?._id || userInfo?._id;

  useEffect(() => {
    if (
      userId &&
      Number(userInfo?.role?.role ?? userInfo?.role ?? 0) === 0 &&
      (!loaded || String(loadedUserId) !== String(userId)) &&
      !loading
    ) {
      dispatch(savedJobsLoadAction(userId));
    }
  }, [dispatch, loaded, loadedUserId, loading, userId, userInfo]);
  const isSaved = savedJobs.some(
    (savedJob) => String(savedJob.job?._id || savedJob.job) === String(jobId),
  );
  const isSaving = savingJobId === jobId;

  const toggleSavedJob = () => {
    if (!userInfo) {
      navigate("/login");
      return;
    }
    if (Number(userInfo.role?.role) !== 0) {
      toast.info("Only job seekers can save jobs.");
      return;
    }

    if (isSaved) {
      dispatch(removeSavedJobAction(jobId));
    } else {
      dispatch(saveJobAction(jobId));
    }
  };

  return (
    <Tooltip title={isSaved ? "Remove from saved jobs" : "Save job"}>
      <span>
        <IconButton
          aria-label={isSaved ? "Remove saved job" : "Save job"}
          onClick={toggleSavedJob}
          disabled={isSaving}
          size={size}
          color={isSaved ? "primary" : "default"}
        >
          {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default SaveJobButton;
