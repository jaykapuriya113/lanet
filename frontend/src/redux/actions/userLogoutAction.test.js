import axios from "axios";
import { userLogoutAction } from "./userAction";
import {
  USER_LOGOUT_REQUEST,
  USER_LOGOUT_SUCCESS,
} from "../constants/userConstant";

jest.mock("axios", () => ({
  get: jest.fn(),
}));

describe("userLogoutAction", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "token=active; path=/";
    axios.get.mockReset();
  });

  test("clears client auth state without calling the broken profile route", async () => {
    localStorage.setItem("userInfo", JSON.stringify({ role: { role: 1 } }));
    const dispatch = jest.fn();

    await userLogoutAction()(dispatch);

    expect(localStorage.getItem("userInfo")).toBeNull();
    expect(document.cookie).not.toContain("token=active");
    expect(axios.get).not.toHaveBeenCalled();
    expect(dispatch.mock.calls).toEqual([
      [{ type: USER_LOGOUT_REQUEST }],
      [{ type: USER_LOGOUT_SUCCESS }],
    ]);
  });
});
