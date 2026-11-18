import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { userSignInAction, userSignUpAction } from "../redux/actions/userAction";
import axios from "axios";
import LogIn from "./LogIn";
import {
  adminLoginValidationSchema,
  validationSchema as loginSchema,
} from "./LogIn";
import Register from "./Register";
import { validationSchema as registrationSchema } from "./Register";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("../component/Footer", () => () => null);
jest.mock("../component/Navbar", () => () => null);
jest.mock("axios", () => ({
  post: jest.fn(),
}));
jest.mock("../redux/actions/userAction", () => ({
  userSignInAction: jest.fn((values) => ({ type: "SIGN_IN", payload: values })),
  userSignUpAction: jest.fn((values) => ({ type: "SIGN_UP", payload: values })),
}));

const validLogin = {
  email: "alex@example.com",
  password: "StrongPass1!",
};

const validRegistration = {
  profilePhoto: "/uploads/profile.png",
  role: "1",
  resume: "",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex@example.com",
  password: "StrongPass1!",
};

const expectInvalid = async (schema, values, path, message) => {
  await expect(schema.validate(values, { abortEarly: false })).rejects.toMatchObject({
    inner: expect.arrayContaining([
      expect.objectContaining({ path, message }),
    ]),
  });
};

const CurrentLocation = () => {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
};

describe("auth form submission", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    dispatch.mockClear();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockImplementation((selector) =>
      selector({ signIn: { isAuthenticated: false, userInfo: null } }),
    );
    userSignInAction.mockClear();
    userSignUpAction.mockClear();
    axios.post.mockReset();
  });

  test("does not dispatch an invalid login and submits a valid login", async () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>,
    );
    fireEvent.submit(container.querySelector("form"));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: validLogin.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: validLogin.password },
    });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() =>
      expect(userSignInAction).toHaveBeenCalledWith(validLogin),
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test("admin login accepts a non-whitespace password without user password rules", async () => {
    const shortPasswordLogin = {
      email: "admin@example.com",
      password: "short",
    };
    await expect(
      adminLoginValidationSchema.validate(shortPasswordLogin),
    ).resolves.toEqual(shortPasswordLogin);
    await expectInvalid(
      adminLoginValidationSchema,
      { ...shortPasswordLogin, password: "   " },
      "password",
      "Password is required",
    );

    const { container } = render(
      <MemoryRouter initialEntries={["/admin/login"]}>
        <LogIn adminLogin />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: shortPasswordLogin.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: shortPasswordLogin.password },
    });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() =>
      expect(userSignInAction).toHaveBeenCalledWith(shortPasswordLogin),
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test("shared login page has no role selector and submits credentials through sign-in", async () => {
    const adminCredentials = {
      email: "admin@example.com",
      password: "short",
    };
    const { container } = render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: /user|recruiter|admin/i })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: adminCredentials.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: adminCredentials.password },
    });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() =>
      expect(userSignInAction).toHaveBeenCalledWith(adminCredentials),
    );
    expect(screen.queryByRole("link", { name: "Admin Login" })).toBeNull();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test("admin authenticated role is routed to the Admin Dashboard", async () => {
    const adminUserInfo = { role: 2 };
    useSelector.mockImplementation((selector) =>
      selector({
        signIn: {
          isAuthenticated: true,
          userInfo: adminUserInfo,
        },
      }),
    );
    render(
      <MemoryRouter initialEntries={["/admin/login"]}>
        <LogIn adminLogin />
        <CurrentLocation />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("current-path")).toHaveTextContent(
        "/mainadmin",
      ),
    );
  });

  test("requires a photo before registration and submits after uploading one", async () => {
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector('input[name="role"][value="1"]'));
    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: validRegistration.firstName },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: validRegistration.lastName },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "1alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: validRegistration.password },
    });
    fireEvent.submit(container.querySelector("form"));

    expect(
      await screen.findByText("Email username must start with a letter"),
    ).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: validRegistration.email },
    });
    fireEvent.submit(container.querySelector("form"));

    expect(
      await screen.findByText("Profile photo is required."),
    ).toBeInTheDocument();
    expect(userSignUpAction).not.toHaveBeenCalled();

    axios.post.mockResolvedValue({ data: { url: "/uploads/profile.png" } });
    fireEvent.change(screen.getByLabelText("profilePhoto"), {
      target: {
        files: [new File(["image"], "profile.PNG", { type: "image/png" })],
      },
    });
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Register" })).toBeEnabled(),
    );
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() =>
      expect(userSignUpAction).toHaveBeenCalledWith(validRegistration),
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test("rejects invalid resume types before upload or registration", async () => {
    axios.post.mockResolvedValue({ data: { url: "/uploads/profile.png" } });
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector('input[name="role"][value="0"]'));
    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Alex" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Morgan" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: validRegistration.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: validRegistration.password },
    });
    fireEvent.change(screen.getByLabelText("profilePhoto"), {
      target: {
        files: [new File(["image"], "profile.png", { type: "image/png" })],
      },
    });
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Register" })).toBeEnabled(),
    );
    axios.post.mockClear();
    fireEvent.change(screen.getByLabelText("Resume"), {
      target: {
        files: [new File(["not a resume"], "picture.jpg", { type: "image/jpeg" })],
      },
    });

    expect(
      await screen.findByText(
        "Only PDF or Word documents (.pdf, .doc, .docx) are allowed.",
      ),
    ).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();

    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(userSignUpAction).not.toHaveBeenCalled());
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("rejects unsupported or over-20-KB profile photos before upload", async () => {
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("profilePhoto"), {
      target: {
        files: [new File(["image"], "profile.gif", { type: "image/gif" })],
      },
    });
    expect(
      await screen.findByText("Only JPG, JPEG, and PNG images are allowed."),
    ).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("profilePhoto"), {
      target: {
        files: [
          new File([new Uint8Array(20 * 1024 + 1)], "profile.jpg", {
            type: "image/jpeg",
          }),
        ],
      },
    });
    expect(
      await screen.findByText("Profile photo must be 20 KB or smaller."),
    ).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();

    fireEvent.submit(container.querySelector("form"));
    expect(userSignUpAction).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("uploads a permitted Word resume", async () => {
    axios.post
      .mockResolvedValueOnce({ data: { url: "/uploads/profile.png" } })
      .mockResolvedValueOnce({ data: { url: "/uploads/resume.docx" } });
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector('input[name="role"][value="0"]'));
    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Alex" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Morgan" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: validRegistration.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: validRegistration.password },
    });
    fireEvent.change(screen.getByLabelText("profilePhoto"), {
      target: {
        files: [new File(["image"], "profile.png", { type: "image/png" })],
      },
    });
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Register" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Resume"), {
      target: {
        files: [new File(["resume"], "resume.DOCX", { type: "application/zip" })],
      },
    });

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Register" })).toBeEnabled(),
    );
    expect(userSignUpAction).not.toHaveBeenCalled();

    fireEvent.submit(container.querySelector("form"));
    await waitFor(() =>
      expect(userSignUpAction).toHaveBeenCalledWith({
        ...validRegistration,
        role: "0",
        profilePhoto: "/uploads/profile.png",
        resume: "/uploads/resume.docx",
      }),
    );
  });
});

describe("login validation", () => {
  test("requires email and password", async () => {
    await expectInvalid(
      loginSchema,
      { email: " ", password: " " },
      "email",
      "Enter a valid email",
    );
    await expectInvalid(
      loginSchema,
      { email: "", password: "" },
      "password",
      "Password is required",
    );
  });

  test("rejects malformed and digit-leading email usernames", async () => {
    await expectInvalid(
      loginSchema,
      { ...validLogin, email: "not-an-email" },
      "email",
      "Enter a valid email",
    );
    await expectInvalid(
      loginSchema,
      { ...validLogin, email: "1alex@example.com" },
      "email",
      "Email username must start with a letter",
    );
  });

  test("requires a strong password and accepts a valid login", async () => {
    await expectInvalid(
      loginSchema,
      { ...validLogin, password: "weakpass" },
      "password",
      "Password must contain at least one uppercase letter",
    );
    await expect(loginSchema.validate(validLogin)).resolves.toEqual(validLogin);
  });
});

describe("registration validation", () => {
  test("requires all existing required fields and rejects whitespace", async () => {
    await expectInvalid(
      registrationSchema,
      {
        ...validRegistration,
        role: "",
        firstName: "   ",
        lastName: "",
        email: "",
        password: "",
      },
      "firstName",
      "First Name is required",
    );
    await expectInvalid(
      registrationSchema,
      { ...validRegistration, role: "0", resume: "   " },
      "resume",
      "Resume is required",
    );
  });

  test("rejects invalid names, email, and weak passwords", async () => {
    await expectInvalid(
      registrationSchema,
      { ...validRegistration, firstName: "Alex3" },
      "firstName",
      "First Name can contain only letters, spaces, apostrophes, and hyphens",
    );
    await expectInvalid(
      registrationSchema,
      { ...validRegistration, email: "1alex@example.com" },
      "email",
      "Email username must start with a letter",
    );
    await expectInvalid(
      registrationSchema,
      { ...validRegistration, password: "weakpass" },
      "password",
      "Password must contain at least one uppercase letter",
    );
  });

  test("requires a picture and validates selected image type and size", async () => {
    await expectInvalid(
      registrationSchema,
      { ...validRegistration, profilePhoto: "" },
      "profilePhoto",
      "Profile photo is required.",
    );
    await expectInvalid(
      registrationSchema,
      {
        ...validRegistration,
        profilePhoto: {
          name: "profile.png",
          type: "image/png",
          size: 20 * 1024 + 1,
        },
      },
      "profilePhoto",
      "Profile photo must be 20 KB or smaller.",
    );
    await expectInvalid(
      registrationSchema,
      {
        ...validRegistration,
        profilePhoto: {
          name: "profile.gif",
          type: "image/gif",
          size: 1024,
        },
      },
      "profilePhoto",
      "Only JPG, JPEG, and PNG images are allowed.",
    );
    for (const [name, type] of [
      ["profile.jpg", "image/jpeg"],
      ["profile.jpeg", "image/jpeg"],
      ["profile.png", "image/png"],
    ]) {
      await expect(
        registrationSchema.validate({
          ...validRegistration,
          profilePhoto: { name, type, size: 20 * 1024 },
        }),
      ).resolves.toBeDefined();
    }
  });
});
