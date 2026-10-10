import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginScreen } from "../pages/LoginScreen";
import { RegistrationScreen } from "../pages/RegistrationScreen";

describe("LoginScreen", () => {
  it("validates fields and only shows the preview message for valid input", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "not-empty");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Form validated. Authentication is not connected yet.",
    );
  });

  it("toggles password visibility and disables navigation without a callback", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  it("invokes the registration callback", async () => {
    const user = userEvent.setup();
    const onRegisterClick = vi.fn();
    render(<LoginScreen onRegisterClick={onRegisterClick} />);
    await user.click(screen.getByRole("button", { name: "Register" }));
    expect(onRegisterClick).toHaveBeenCalledOnce();
  });
});

describe("RegistrationScreen", () => {
  it("validates required fields, email, and matching passwords", async () => {
    const user = userEvent.setup();
    render(<RegistrationScreen />);

    await user.type(screen.getByLabelText("Full name"), "Jamie Example");
    await user.type(screen.getByLabelText("Email"), "invalid");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("validates matching values without claiming account creation", async () => {
    const user = userEvent.setup();
    render(<RegistrationScreen />);

    await user.type(screen.getByLabelText("Full name"), "Jamie Example");
    await user.type(screen.getByLabelText("Email"), "jamie@example.com");
    await user.type(screen.getByLabelText("Password"), "same-value");
    await user.type(screen.getByLabelText("Confirm password"), "same-value");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Form validated. Authentication is not connected yet.",
    );
  });

  it("toggles both password fields and invokes the login callback", async () => {
    const user = userEvent.setup();
    const onLoginClick = vi.fn();
    render(<RegistrationScreen onLoginClick={onLoginClick} />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    await user.click(screen.getByRole("button", { name: "Show confirm password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(onLoginClick).toHaveBeenCalledOnce();
  });
});
