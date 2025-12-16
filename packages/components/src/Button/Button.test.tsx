import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";

const renderButton = (
  props: Partial<ButtonProps> = { children: "Click me" }
) => {
  return render(<Button {...(props as ButtonProps)} />);
};

describe("Button", () => {
  test("renders button with children", () => {
    renderButton();
    expect(
      screen.getByRole("button", { name: "Click me" })
    ).toBeInTheDocument();
  });

  test("forwards HTML attributes to button element", () => {
    renderButton({
      "aria-label": "Custom label",
      id: "test-button",
      type: "submit",
    });
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Custom label");
    expect(button).toHaveAttribute("id", "test-button");
    expect(button).toHaveAttribute("type", "submit");
  });

  test("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderButton({ onClick: handleClick });
    const button = screen.getByRole("button");
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("disables button when disabled prop is true", () => {
    renderButton({ disabled: true });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("disables button when loading prop is true", () => {
    renderButton({ loading: true });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("disables button when both disabled and loading are true", () => {
    renderButton({ disabled: true, loading: true });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("shows loading spinner when loading is true", () => {
    renderButton({ loading: true });
    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toBeInTheDocument();
  });

  test("does not show spinner when loading is false", () => {
    renderButton({ loading: false });
    expect(
      screen.queryByRole("status", { name: "Loading" })
    ).not.toBeInTheDocument();
  });

  test("renders iconStart when provided", () => {
    const { container } = renderButton({
      iconStart: <span data-testid="icon-start">Icon</span>,
    });
    expect(
      container.querySelector('[data-testid="icon-start"]')
    ).toBeInTheDocument();
  });

  test("renders iconEnd when provided", () => {
    const { container } = renderButton({
      iconEnd: <span data-testid="icon-end">Icon</span>,
    });
    expect(
      container.querySelector('[data-testid="icon-end"]')
    ).toBeInTheDocument();
  });

  test("renders both iconStart and iconEnd when provided", () => {
    const { container } = renderButton({
      iconStart: <span data-testid="icon-start">Start</span>,
      iconEnd: <span data-testid="icon-end">End</span>,
    });
    expect(
      container.querySelector('[data-testid="icon-start"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="icon-end"]')
    ).toBeInTheDocument();
  });

  test("renders children when iconOnly is false or undefined", () => {
    renderButton({ iconOnly: false, children: "Click me" });
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  test("renders icon-only button when iconOnly is true", () => {
    const { container } = renderButton({
      iconOnly: true,
      iconStart: <span data-testid="icon">Icon</span>,
    });
    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
    expect(screen.queryByText("Click me")).not.toBeInTheDocument();
  });

  test("does not call onClick when button is disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderButton({ onClick: handleClick, disabled: true });
    const button = screen.getByRole("button");
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test("does not call onClick when button is loading", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderButton({ onClick: handleClick, loading: true });
    const button = screen.getByRole("button");
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test("merges custom className with component classes", () => {
    renderButton({ className: "custom-class" });
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  describe("asChild", () => {
    test("renders child element instead of button when asChild is true", () => {
      render(
        <Button asChild>
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(screen.getByRole("link", { name: "Link" })).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    test("preserves child element href attribute", () => {
      render(
        <Button asChild>
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "https://example.com"
      );
    });

    test("merges button className onto child element", () => {
      render(
        <Button asChild className="custom-class">
          <a href="https://example.com">Link</a>
        </Button>
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("custom-class");
    });

    test("renders iconStart with asChild", () => {
      const { container } = render(
        <Button asChild iconStart={<span data-testid="icon-start">Icon</span>}>
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(
        container.querySelector('[data-testid="icon-start"]')
      ).toBeInTheDocument();
    });

    test("renders iconEnd with asChild", () => {
      const { container } = render(
        <Button asChild iconEnd={<span data-testid="icon-end">Icon</span>}>
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(
        container.querySelector('[data-testid="icon-end"]')
      ).toBeInTheDocument();
    });

    test("shows loading spinner when loading is true with asChild", () => {
      render(
        <Button asChild loading>
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(
        screen.getByRole("status", { name: "Loading" })
      ).toBeInTheDocument();
    });

    test("sets aria-disabled when disabled with asChild", () => {
      render(
        <Button asChild disabled>
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(screen.getByRole("link")).toHaveAttribute("aria-disabled", "true");
    });

    test("sets aria-disabled when loading with asChild", () => {
      render(
        <Button asChild loading>
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(screen.getByRole("link")).toHaveAttribute("aria-disabled", "true");
    });

    test("renders child content inside button structure", () => {
      render(
        <Button asChild>
          <a href="https://example.com">Link Text</a>
        </Button>
      );
      expect(screen.getByText("Link Text")).toBeInTheDocument();
    });

    test("falls back to regular button when children is not a valid element", () => {
      render(<Button asChild>Just text</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
