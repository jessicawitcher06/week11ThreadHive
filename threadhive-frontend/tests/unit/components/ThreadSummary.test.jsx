import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ThreadSummary from "../../../src/components/ThreadList/ThreadSummary";

describe("ThreadSummary Component", () => {
  it("renders the AI Summary heading", () => {
    render(<ThreadSummary summary="Test summary" />);
    expect(screen.getByText(/ai summary/i)).toBeInTheDocument();
  });

  it("renders the summary text", () => {
    render(<ThreadSummary summary="This is an AI generated summary" />);
    expect(
      screen.getByText("This is an AI generated summary"),
    ).toBeInTheDocument();
  });

  it("renders different summary text correctly", () => {
    render(<ThreadSummary summary="Another unique summary text" />);
    expect(
      screen.getByText("Another unique summary text"),
    ).toBeInTheDocument();
  });

  it("renders the robot icon element", () => {
    const { container } = render(<ThreadSummary summary="Test" />);
    expect(container.querySelector(".bi-robot")).toBeInTheDocument();
  });
});
