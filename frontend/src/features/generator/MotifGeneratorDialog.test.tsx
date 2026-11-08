import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { cloneInitialMaterials } from "../../domain/material";
import { MotifGeneratorDialog } from "./MotifGeneratorDialog";

function renderDialog() {
  const onApply = vi.fn();
  const onClose = vi.fn();
  const onPreview = vi.fn();
  render(
    <MotifGeneratorDialog
      materials={cloneInitialMaterials()}
      motif={{ widthMm: 80, heightMm: 60 }}
      onApply={onApply}
      onClose={onClose}
      onPreview={onPreview}
      projectMinimumGapMm={0.5}
    />,
  );
  return { onApply, onClose, onPreview };
}

describe("motif oluşturma penceresi", () => {
  it("tahmini kesin sonuç olmadığını belirtir ve projeyi değiştirmeden önizleme üretir", async () => {
    const user = userEvent.setup();
    const { onApply, onPreview } = renderDialog();
    expect(screen.getByText(/Tahmin kesin sonuç değildir/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Önizleme üret" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Üretim raporu" })).toBeInTheDocument());
    expect(onApply).not.toHaveBeenCalled();
    const preview = onPreview.mock.calls.at(-1)?.[0];
    expect(preview.length).toBeGreaterThan(0);
    expect(screen.getByText(/başarılı \/ .* reddedildi/)).toBeInTheDocument();
  });

  it("uygulamada önizlemedeki koordinat, malzeme ve açıları aynen iletir", async () => {
    const user = userEvent.setup();
    const { onApply, onPreview } = renderDialog();
    await user.click(screen.getByRole("button", { name: "Önizleme üret" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Motifi uygula" })).toBeEnabled());
    const preview = onPreview.mock.calls.at(-1)?.[0];

    await user.click(screen.getByRole("button", { name: "Motifi uygula" }));

    expect(onApply).toHaveBeenCalledWith(preview, "append");
  });

  it("ayar değişince eski önizlemeyi geçersiz kılar", async () => {
    const user = userEvent.setup();
    const { onPreview } = renderDialog();
    await user.click(screen.getByRole("button", { name: "Önizleme üret" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Motifi uygula" })).toBeEnabled());

    await user.clear(screen.getByLabelText("Rastgelelik tohumu (seed)"));
    await user.type(screen.getByLabelText("Rastgelelik tohumu (seed)"), "yeni-seed");

    expect(screen.getByRole("button", { name: "Motifi uygula" })).toBeDisabled();
    expect(onPreview.mock.calls.at(-1)?.[0]).toEqual([]);
  });

  it("geçersiz ölçü ve boş malzeme seçimini üretimden önce reddeder", async () => {
    const user = userEvent.setup();
    renderDialog();
    const width = screen.getByLabelText("Üretim motif genişliği");
    await user.clear(width);
    await user.type(width, "0");
    await user.click(screen.getByRole("checkbox", { name: /Kum boncuk/ }));

    expect(screen.getByText(/Motif genişliği/)).toBeInTheDocument();
    expect(screen.getByText(/En az bir etkin katalog malzemesi/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Önizleme üret" })).toBeDisabled();
  });

  it("radyal tekrar seçeneklerini ve mevcut tasarımı değiştirme modunu sunar", async () => {
    const user = userEvent.setup();
    const { onApply } = renderDialog();
    await user.selectOptions(screen.getByLabelText("Simetri türü"), "radial");
    expect(screen.getByLabelText("Radyal tekrar")).toHaveValue("6");
    expect(screen.getAllByRole("option").some((option) => option.textContent === "12 yön")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Önizleme üret" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Motifi uygula" })).toBeEnabled());
    await user.click(screen.getByRole("radio", { name: "Mevcut tasarımı değiştir" }));
    await user.click(screen.getByRole("button", { name: "Motifi uygula" }));
    expect(onApply.mock.calls.at(-1)?.[1]).toBe("replace");
  });

  it("kapatırken geçici önizlemeyi temizler", async () => {
    const user = userEvent.setup();
    const { onClose, onPreview } = renderDialog();
    await user.click(screen.getByRole("button", { name: "Motif oluşturma penceresini kapat" }));
    expect(onPreview).toHaveBeenLastCalledWith([]);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
