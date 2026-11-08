import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("../features/workspace/DesignWorkspace", () => ({
  DesignWorkspace: ({ workspace }: { workspace: { widthMm: number; heightMm: number } }) => (
    <div data-testid="design-workspace">
      {workspace.widthMm} × {workspace.heightMm} mm
    </div>
  ),
}));

describe("temel uygulama kabuğu", () => {
  it("Türkçe üç panel arayüzünü ve aşama durumunu gösterir", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Malzeme kütüphanesi" })).toBeInTheDocument();
    expect(await screen.findByTestId("design-workspace")).toHaveTextContent("200 × 250 mm");
    expect(screen.getByRole("heading", { name: "Tasarım özellikleri" })).toBeInTheDocument();
    expect(screen.getByText("Aşama 1")).toBeInTheDocument();
  });

  it("henüz geliştirilmeyen proje işlemlerini devre dışı tutar", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Yeni proje" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Geri al" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dışa aktar" })).toBeDisabled();
  });

  it("geçerli ölçüleri milimetre modeline uygular", async () => {
    const user = userEvent.setup();
    render(<App />);

    const width = screen.getByLabelText("Genişlik");
    const height = screen.getByLabelText("Yükseklik");
    await user.clear(width);
    await user.type(width, "300");
    await user.clear(height);
    await user.type(height, "400");
    await user.click(screen.getByRole("button", { name: "Ölçüleri uygula" }));

    expect(await screen.findByTestId("design-workspace")).toHaveTextContent("300 × 400 mm");
    expect(screen.getByText("300 × 400 mm uygulandı")).toBeInTheDocument();
  });

  it("geçersiz ölçüyü uygulamaz", async () => {
    const user = userEvent.setup();
    render(<App />);

    const width = screen.getByLabelText("Genişlik");
    await user.clear(width);
    await user.type(width, "0");
    await user.click(screen.getByRole("button", { name: "Ölçüleri uygula" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Ölçüler en az 1 mm olmalıdır.");
    expect(await screen.findByTestId("design-workspace")).toHaveTextContent("200 × 250 mm");
  });
});

