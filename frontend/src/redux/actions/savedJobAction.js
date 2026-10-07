import axios from "axios";
import { toast } from "react-toastify";
import {
  REMOVE_SAVED_JOB_FAIL,
  REMOVE_SAVED_JOB_REQUEST,
  REMOVE_SAVED_JOB_SUCCESS,
  SAVE_JOB_FAIL,
  SAVE_JOB_REQUEST,
  SAVE_JOB_SUCCESS,
  SAVED_JOBS_LOAD_FAIL,
  SAVED_JOBS_LOAD_REQUEST,
  SAVED_JOBS_LOAD_SUCCESS,
} from "../constants/savedJobConstant";

export const savedJobsLoadAction = (userId) => async (dispatch) => {
  dispatch({ type: SAVED_JOBS_LOAD_REQUEST, meta: { userId } });
  try {
    const { data } = await axios.get("/api/user/saved-jobs", {
      withCredentials: true,
    });
    dispatch({
      type: SAVED_JOBS_LOAD_SUCCESS,
      payload: data.savedJobs,
      meta: { userId },
    });
  } catch (error) {
    dispatch({
      type: SAVED_JOBS_LOAD_FAIL,
      payload: error.response?.data?.error || "Unable to load saved jobs",
    });
  }
};

export const saveJobAction = (jobId) => async (dispatch) => {
  dispatch({ type: SAVE_JOB_REQUEST, meta: { jobId } });
  try {
    const { data } = await axios.post(
      `/api/user/saved-jobs/${jobId}`,
      {},
      { withCredentials: true },
    );
    dispatch({ type: SAVE_JOB_SUCCESS, payload: data.savedJob });
    toast.success("Job saved");
  } catch (error) {
    dispatch({
      type: SAVE_JOB_FAIL,
      payload: error.response?.data?.error || "Unable to save job",
    });
    toast.error(error.response?.data?.error || "Unable to save job");
  }
};

export const removeSavedJobAction = (jobId) => async (dispatch) => {
  dispatch({ type: REMOVE_SAVED_JOB_REQUEST, meta: { jobId } });
  try {
    await axios.delete(`/api/user/saved-jobs/${jobId}`, {
      withCredentials: true,
    });
    dispatch({ type: REMOVE_SAVED_JOB_SUCCESS, payload: jobId });
    toast.success("Job removed from saved jobs");
  } catch (error) {
    dispatch({
      type: REMOVE_SAVED_JOB_FAIL,
      payload: error.response?.data?.error || "Unable to remove saved job",
    });
    toast.error(error.response?.data?.error || "Unable to remove saved job");
  }
};
