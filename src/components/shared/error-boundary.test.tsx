import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "./error-boundary";

// Suppress console.error from ErrorBoundary.componentDidCatch in tests
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function ThrowError({ message }: { message: string }) {
  throw new Error(message);
}

function GoodChild() {
  return <div data-testid="child">Hello</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("shows fallback message when error message is null", () => {
    function ThrowNull() {
      // Simulate an error whose message is undefined (triggers ?? fallback)
      const err = new Error();
      Object.defineProperty(err, "message", { value: undefined });
      throw err;
    }
    render(
      <ErrorBoundary>
        <ThrowNull />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred."),
    ).toBeInTheDocument();
  });

  it("shows empty paragraph when error message is empty string", () => {
    // new Error() sets message to "" and ?? doesn't catch empty strings
    function ThrowEmpty() {
      throw new Error();
    }
    const { container } = render(
      <ErrorBoundary>
        <ThrowEmpty />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    const para = container.querySelector("p.text-muted-foreground");
    expect(para).toBeInTheDocument();
    expect(para!.textContent).toBe("");
  });

  it("shows Try again button in error state", () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Oops" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("recovers when Try again is clicked", () => {
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) {
        throw new Error("boom");
      }
      return <div data-testid="recovered">Recovered!</div>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );

    // Error state should show
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Fix the error and click Try again
    shouldThrow = false;
    fireEvent.click(screen.getByText("Try again"));

    // Should now render the recovered child
    expect(screen.getByTestId("recovered")).toBeInTheDocument();
  });

  it("logs error to console.error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError message="console test" />
      </ErrorBoundary>,
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("does not affect sibling components", () => {
    const { container } = render(
      <div>
        <div data-testid="sibling">Sibling</div>
        <ErrorBoundary>
          <ThrowError message="isolated" />
        </ErrorBoundary>
      </div>,
    );

    expect(screen.getByTestId("sibling")).toBeInTheDocument();
    // Use container-scoped query to avoid matching across multiple renders
    const errorHeadings = container.querySelectorAll("h2");
    const hasErrorMessage = Array.from(errorHeadings).some(
      (h2) => h2.textContent === "Something went wrong",
    );
    expect(hasErrorMessage).toBe(true);
  });
});
