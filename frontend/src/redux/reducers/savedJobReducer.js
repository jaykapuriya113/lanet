import {
  REMOVE_SAVED_JOB_REQUEST,
  REMOVE_SAVED_JOB_SUCCESS,
  SAVE_JOB_REQUEST,
  SAVE_JOB_SUCCESS,
  SAVED_JOBS_LOAD_FAIL,
  SAVED_JOBS_LOAD_REQUEST,
  SAVED_JOBS_LOAD_SUCCESS,
} from "../constants/savedJobConstant";
import {
  USER_LOGOUT_SUCCESS,
  USER_SIGNIN_SUCCESS,
} from "../constants/userConstant";

const initialState = {
  savedJobs: [],
  loading: false,
  loaded: false,
  loadedUserId: null,
  savingJobId: null,
};

export const savedJobReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_SIGNIN_SUCCESS:
    case USER_LOGOUT_SUCCESS:
      return initialState;
    case SAVED_JOBS_LOAD_REQUEST:
      return { ...state, loading: true };
    case SAVED_JOBS_LOAD_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        loadedUserId: action.meta?.userId || state.loadedUserId,
        savedJobs: action.payload || [],
      };
    case SAVED_JOBS_LOAD_FAIL:
      return {
        ...state,
        loading: false,
        loaded: true,
        error: action.payload,
      };
    case SAVE_JOB_REQUEST:
    case REMOVE_SAVED_JOB_REQUEST:
      return { ...state, savingJobId: action.meta?.jobId || null };
    case SAVE_JOB_SUCCESS: {
      const savedJob = action.payload;
      if (!savedJob || !savedJob.job) {
        return { ...state, savingJobId: null };
      }

      const savedJobId = String(savedJob.job?._id || savedJob.job || "");
      const alreadySaved = state.savedJobs.some(
        (item) => String(item.job?._id || item.job || "") === savedJobId,
      );

      return {
        ...state,
        savingJobId: null,
        savedJobs: alreadySaved
          ? state.savedJobs
          : [savedJob, ...state.savedJobs],
      };
    }
    case REMOVE_SAVED_JOB_SUCCESS:
      return {
        ...state,
        savingJobId: null,
        savedJobs: state.savedJobs.filter(
          (item) =>
            String(item.job?._id || item.job || "") !== String(action.payload),
        ),
      };
    default:
      return state;
  }
};
