import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../component/Navbar";
import HeaderTop from "./global/HeaderTop";
import { userLogoutAction } from "../redux/actions/userAction";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("react-pro-sidebar", () => ({
  useProSidebar: () => ({ collapseSidebar: jest.fn() }),
}));
jest.mock("../component/NotificationCenter", () => () => null);
jest.mock("../redux/actions/userAction", () => ({
  userLogoutAction: jest.fn(() => () => {}),
}));

const signedInUser = {
  firstName: "Alex",
  lastName: "Morgan",
  profilePhoto: "",
  role: { role: 0 },
};

const Location = () => {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
};

const renderWithAppProviders = (component) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter initialEntries={["/"]}>
        {component}
        <Location />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("profile-menu logout navigation", () => {
  const dispatch = jest.fn();
  let currentUserInfo = signedInUser;

  beforeEach(() => {
    dispatch.mockClear();
    userLogoutAction.mockClear();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockImplementation((selector) =>
      selector({
        signIn: { userInfo: currentUserInfo, isAuthenticated: Boolean(currentUserInfo) },
        userprofile: { user: currentUserInfo },
      }),
    );
  });

  const selectLogout = async () => {
    fireEvent.click(screen.getByLabelText("Account"));
    fireEvent.click(await screen.findByText("Logout"));
  };

  test("Home profile menu logs out and navigates to Login", async () => {
    renderWithAppProviders(<Navbar />);

    await selectLogout();

    await waitFor(() =>
      expect(screen.getByTestId("current-path")).toHaveTextContent("/login"),
    );
    expect(userLogoutAction).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test.each([0, 1, 2])(
    "Dashboard for role %s logs out and navigates to Login",
    async (role) => {
      currentUserInfo = {
        ...signedInUser,
        role: { ...signedInUser.role, role },
      };
      renderWithAppProviders(<HeaderTop />);

      fireEvent.click(screen.getByRole("button", { name: "Logout" }));

      await waitFor(() =>
        expect(screen.getByTestId("current-path")).toHaveTextContent("/login"),
      );
      expect(userLogoutAction).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(screen.queryByLabelText("Open profile menu")).not.toBeInTheDocument();
    },
  );

  test.each([320, 768, 1024, 1366])(
    "keeps the dashboard Logout button visible at %s px with chat content present",
    async (viewportWidth) => {
      window.innerWidth = viewportWidth;
      window.dispatchEvent(new Event("resize"));
      currentUserInfo = signedInUser;
      renderWithAppProviders(
        <>
          <HeaderTop />
          <div
            data-testid="chat-panel"
            style={{ position: "fixed", inset: 0, zIndex: 2 }}
          >
            Chat panel content
          </div>
        </>,
      );

      const logoutButton = screen.getByRole("button", { name: "Logout" });
      expect(logoutButton).toBeVisible();
      expect(getComputedStyle(logoutButton).flexShrink).toBe("0");

      const header = logoutButton.closest("header");
      expect(header).not.toBeNull();
      expect(getComputedStyle(header).position).toBe("sticky");
      expect(Number(getComputedStyle(header).zIndex)).toBeGreaterThan(100);
      expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
      expect(Number(getComputedStyle(header).zIndex)).toBeGreaterThan(
        Number(getComputedStyle(screen.getByTestId("chat-panel")).zIndex),
      );

      fireEvent.click(logoutButton);
      await waitFor(() =>
        expect(screen.getByTestId("current-path")).toHaveTextContent("/login"),
      );
    },
  );
});
