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
  USER_DELETE_FAIL,
  USER_DELETE_REQUEST,
  USER_DELETE_SUCCESS,
  USER_FORGET_PASSWORD_FAIL,
  USER_FORGET_PASSWORD_REQUEST,
  USER_FORGET_PASSWORD_SUCCESS,
  USER_LOAD_FAIL,
  USER_LOAD_REQUEST,
  USER_LOAD_SUCCESS,
  USER_LOGOUT_FAIL,
  USER_LOGOUT_REQUEST,
  USER_LOGOUT_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_SIGNIN_REQUEST,
  USER_SIGNIN_SUCCESS,
  USER_SIGNUP_FAIL,
  USER_SIGNUP_REQUEST,
  USER_SIGNUP_SUCCESS,
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
    dispatch({
      type: USER_SIGNIN_FAIL,
      payload: error.response.data.error,
    });
    toast.error(error.response.data.error);
  }
};

// user sign up action
export const userSignUpAction = (user) => async (dispatch) => {
  dispatch({ type: USER_SIGNUP_REQUEST });
  try {
    const { data } = await axios.post("/api/signup", user);
    console.log(data);
    dispatch({
      type: USER_SIGNUP_SUCCESS,
      payload: data,
    });
    toast.success("Register Successfully!");
  } catch (error) {
    console.log("ERROR------------------->", error);

    dispatch({
      type: USER_SIGNUP_FAIL,
      payload: error.response.data.error,
    });
    toast.error(error.response.data.error);
  }
};

//log out action
export const userLogoutAction = () => async (dispatch) => {
  dispatch({ type: USER_LOGOUT_REQUEST });
  try {
    localStorage.removeItem("userInfo");
    const { data } = await axios.get("/api/logout");
    dispatch({
      type: USER_LOGOUT_SUCCESS,
      payload: data,
    });
    toast.success("Log out successfully!");
  } catch (error) {
    dispatch({
      type: USER_LOGOUT_FAIL,
      payload: error.response.data.error,
    });
    toast.error(error.response.data.error);
  }
};

//user profile action
export const userProfileAction = () => async (dispatch) => {
  dispatch({ type: USER_LOAD_REQUEST });
  try {
    const { data } = await axios.get("/api/me");
    dispatch({
      type: USER_LOAD_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: USER_LOAD_FAIL,
      payload: error.response.data.error,
    });
  }
};

//all user action
export const allUserAction = (page, pageSize) => async (dispatch) => {
  dispatch({ type: ALL_USER_LOAD_REQUEST });
  try {
    const { data } = await axios.get(
      `/api/allusers?pageNumber=${page}&pageSize=${pageSize}`
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
    const { data } = await axios.get(
     "/api/showallusers"
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
//user job apply action
export const userApplyJobAction = (Job) => async (dispatch) => {
  dispatch({ type: USER_APPLY_JOB_REQUEST });

  try {
    const { data } = await axios.post("/api/user/jobhistory", Job);

    dispatch({
      type: USER_APPLY_JOB_SUCCESS,
      payload: data,
    });
    toast.success("Apply Successfully for this Job!");
  } catch (error) {
    dispatch({
      type: USER_APPLY_JOB_FAIL,
      payload: error.response.data.message,
    });
    toast.error(error.response.data.message);
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
