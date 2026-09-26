import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import CatalogCompositionModePicker from "./CatalogCompositionModePicker";

describe("CatalogCompositionModePicker", () => {
  it("explica los tres modos y comunica la selección", () => {
    const onChange = vi.fn();
    render(<CatalogCompositionModePicker value="automatic" onChange={onChange} />);

    expect(screen.getByRole("button", { name: /Por alcance/ }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Personalizado/ }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desde cero/ }))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Desde cero/ }));
    expect(onChange).toHaveBeenCalledWith("manual");
  });
});
