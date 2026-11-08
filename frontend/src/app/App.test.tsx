import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("../features/workspace/DesignWorkspace", () => ({
  DesignWorkspace: ({
    motif,
    placements,
    notice,
    projectName,
    isDirty,
    onAddPlacement,
    onSelectPlacement,
  }: {
    motif: { widthMm: number; heightMm: number };
    placements: Array<{ id: string; xMm: number; yMm: number; rotationDeg: number }>;
    notice: string | null;
    projectName: string;
    isDirty: boolean;
    onAddPlacement(point: { x: number; y: number }): boolean;
    onSelectPlacement(id?: string): void;
  }) => (
    <div data-plane="infinite" data-testid="design-workspace">
      <h1>{projectName}</h1>
      <span>{isDirty ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}</span>
      Motif {motif.widthMm} × {motif.heightMm} mm
      <button onClick={() => onAddPlacement({ x: 0, y: 0 })} type="button">Orijine yerleştir</button>
      <button onClick={() => onAddPlacement({ x: 10, y: 0 })} type="button">10 mm noktasına yerleştir</button>
      <button onClick={() => onSelectPlacement(placements[0]?.id)} type="button">İlk nesneyi seç</button>
      <output data-testid="placement-state">
        {placements.map((item) => `${item.xMm},${item.yMm},${item.rotationDeg}`).join("|")}
      </output>
      <output data-testid="editor-notice">{notice}</output>
    </div>
  ),
}));

describe("temel uygulama kabuğu", () => {
  it("Türkçe üç panel arayüzünü ve aşama durumunu gösterir", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Malzeme kütüphanesi" })).toBeInTheDocument();
    expect(await screen.findByTestId("design-workspace")).toHaveTextContent("Motif 200 × 250 mm");
    expect(screen.getByRole("heading", { name: "Tasarım özellikleri" })).toBeInTheDocument();
    expect(screen.getByText("Aşama 5")).toBeInTheDocument();
  });

  it("proje işlemlerini etkin, geçmiş işlemlerini duruma bağlı tutar", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Yeni proje" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Geri al" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dışa aktar" })).toBeEnabled();
  });

  it("geçerli motif ölçülerini sonsuz düzlemden bağımsız uygular", async () => {
    const user = userEvent.setup();
    render(<App />);

    const width = screen.getByLabelText("Motif genişliği");
    const height = screen.getByLabelText("Motif yüksekliği");
    await user.clear(width);
    await user.type(width, "300");
    await user.clear(height);
    await user.type(height, "400");
    await user.click(screen.getByRole("button", { name: "Motif ölçülerini uygula" }));

    const plane = await screen.findByTestId("design-workspace");
    expect(plane).toHaveAttribute("data-plane", "infinite");
    expect(plane).toHaveTextContent("Motif 300 × 400 mm");
    expect(screen.getByText("300 × 400 mm uygulandı")).toBeInTheDocument();
  });

  it("geçersiz ölçüyü uygulamaz", async () => {
    const user = userEvent.setup();
    render(<App />);

    const width = screen.getByLabelText("Motif genişliği");
    await user.clear(width);
    await user.type(width, "0");
    await user.click(screen.getByRole("button", { name: "Motif ölçülerini uygula" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Motif ölçüleri en az 1 mm olmalıdır.");
    expect(await screen.findByTestId("design-workspace")).toHaveTextContent("Motif 200 × 250 mm");
  });

  it("motif kılavuzunu arka plan boyutunu değiştirmeden açıp kapatır", async () => {
    const user = userEvent.setup();
    render(<App />);

    const guideSwitch = screen.getByRole("switch", { name: /Motif sınır kılavuzu/ });
    expect(guideSwitch).toBeChecked();
    await user.click(guideSwitch);
    expect(guideSwitch).not.toBeChecked();
    expect(await screen.findByTestId("design-workspace")).toHaveAttribute("data-plane", "infinite");
  });

  it("arayüzden yeni malzeme ekler ve yerel kayda yazar", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Malzeme ekle" }));
    await user.type(screen.getByLabelText("Malzeme adı"), "Kristal boru");
    await user.selectOptions(screen.getByLabelText("Malzeme türü"), "rectangle");
    await user.clear(screen.getByLabelText("Genişlik (mm)"));
    await user.type(screen.getByLabelText("Genişlik (mm)"), "3,2");
    await user.clear(screen.getByLabelText("Yükseklik (mm)"));
    await user.type(screen.getByLabelText("Yükseklik (mm)"), "6");
    await user.click(screen.getByRole("button", { name: "Malzemeyi ekle" }));

    expect(screen.getByText("Kristal boru")).toBeInTheDocument();
    expect(screen.getByText("5 malzeme")).toBeInTheDocument();
    expect(window.localStorage.length).toBe(1);
  });

  it("mevcut malzemeyi düzenler", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "İnci malzemesini düzenle" }));
    const name = screen.getByLabelText("Malzeme adı");
    await user.clear(name);
    await user.type(name, "Mat inci");
    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));

    expect(screen.getByText("Mat inci")).toBeInTheDocument();
    expect(screen.queryByText("İnci")).not.toBeInTheDocument();
  });

  it("malzemeyi yalnız onaydan sonra siler", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Pul malzemesini sil" }));
    const dialog = screen.getByRole("alertdialog", { name: "Malzemeyi sil?" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Pul")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Malzemeyi sil" }));

    expect(screen.queryByText("Pul")).not.toBeInTheDocument();
    expect(screen.getByText("3 malzeme")).toBeInTheDocument();
  });

  it("katalogdan seçilen malzemeyi yerleştirir, çakışanı reddeder ve gerçek sayacı günceller", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "İnci ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.click(screen.getByRole("button", { name: "Orijine yerleştir" }));

    expect(screen.getByTestId("placement-state")).toHaveTextContent("0,0,0");
    const counterSection = screen.getByRole("heading", { name: "Malzeme sayacı" }).closest("section");
    expect(counterSection).not.toBeNull();
    expect(within(counterSection!).getByText("İnci").closest("li")).toHaveTextContent("1 adet");
    expect(screen.getByText("Bu konum başka bir malzemeyle çakışıyor.")).toBeInTheDocument();
  });

  it("seçili nesnenin koordinatını düzenler ve işlemi geri alıp yineler", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Kum boncuk ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.click(screen.getByRole("button", { name: "İlk nesneyi seç" }));
    const xInput = screen.getByLabelText("X koordinatı");
    await user.clear(xInput);
    await user.type(xInput, "-12,5");
    await user.click(screen.getByRole("button", { name: "Nesne özelliklerini uygula" }));
    expect(screen.getByTestId("placement-state")).toHaveTextContent("-12.5,0,0");

    await user.click(screen.getByRole("button", { name: "Geri al" }));
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0,0,0");
    await user.click(screen.getByRole("button", { name: "Yinele" }));
    expect(screen.getByTestId("placement-state")).toHaveTextContent("-12.5,0,0");
  });

  it("tasarımda kullanılan malzemenin silinmesini engeller", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Pul ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.click(screen.getByRole("button", { name: "Pul malzemesini sil" }));
    await user.click(screen.getByRole("button", { name: "Malzemeyi sil" }));

    expect(screen.getByRole("button", { name: "Pul ile yerleştirme moduna geç" })).toBeInTheDocument();
    expect(screen.getByText("Bu malzeme tasarımda kullanıldığı için silinemez.")).toBeInTheDocument();
  });

  it("malzeme ölçüsü değişikliği çakışma oluşturursa katalog güncellemesini reddeder", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "İnci ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.click(screen.getByRole("button", { name: "10 mm noktasına yerleştir" }));
    await user.click(screen.getByRole("button", { name: "İnci malzemesini düzenle" }));
    const diameter = screen.getByLabelText("Dış çap / genişlik (mm)");
    await user.clear(diameter);
    await user.type(diameter, "12");
    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));

    expect(screen.getByText("Ölçü değişikliği mevcut tasarımda çakışma oluşturduğu için uygulanmadı.")).toBeInTheDocument();
    expect(screen.getByText(/4 × 4 mm · Daire/)).toBeInTheDocument();
  });

  it("klavye kısayollarıyla yerleştirmeyi iptal eder, geri alır, yineler ve siler", async () => {
    const user = userEvent.setup();
    render(<App />);

    const materialButton = screen.getByRole("button", { name: "Kum boncuk ile yerleştirme moduna geç" });
    await user.click(materialButton);
    expect(materialButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(materialButton).toHaveAttribute("aria-pressed", "false");

    await user.click(materialButton);
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(screen.getByTestId("placement-state")).toBeEmptyDOMElement();
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0,0,0");
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    fireEvent.keyDown(window, { key: "y", ctrlKey: true });
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0,0,0");
    await user.click(screen.getByRole("button", { name: "İlk nesneyi seç" }));
    fireEvent.keyDown(window, { key: "Delete" });
    expect(screen.getByTestId("placement-state")).toBeEmptyDOMElement();
  });

  it("değişiklik durumunu undo ve redo ile kayıt anına göre hesaplar", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText("Tüm değişiklikler kaydedildi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "İnci ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    expect(screen.getByText("Kaydedilmemiş değişiklikler")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Geri al" }));
    expect(screen.getByText("Tüm değişiklikler kaydedildi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yinele" }));
    expect(screen.getByText("Kaydedilmemiş değişiklikler")).toBeInTheDocument();
  });

  it("başarılı JSON kaydından sonra değişiklik göstergesini temizler", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "İnci ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    expect(screen.getByText("Kaydedilmemiş değişiklikler")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByText("Tüm değişiklikler kaydedildi")).toBeInTheDocument();
    expect(screen.getByText("Proje JSON dosyası olarak kaydedildi.")).toBeInTheDocument();
  });

  it("yeni proje için kaydedilmemiş değişiklik onayı alır ve kataloğu korur", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "İnci ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.click(screen.getByRole("button", { name: "Yeni proje" }));
    expect(screen.getByRole("alertdialog", { name: "Yeni proje oluşturulsun mu?" })).toBeInTheDocument();
    expect(screen.getByTestId("placement-state")).not.toBeEmptyDOMElement();
    await user.click(screen.getByRole("button", { name: "Kaydetmeden yeni proje" }));
    expect(screen.getByTestId("placement-state")).toBeEmptyDOMElement();
    expect(screen.getByText("4 malzeme")).toBeInTheDocument();
    expect(screen.getByText("Tüm değişiklikler kaydedildi")).toBeInTheDocument();
  });

  it("hatalı proje açma mevcut tasarımı değiştirmez", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "İnci ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.upload(screen.getByLabelText("Proje dosyası seç"), new File(["{bozuk"], "bozuk.json", { type: "application/json" }));
    expect(await screen.findByText(/Proje açılamadı: Dosya geçerli JSON biçiminde değil/)).toBeInTheDocument();
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0,0,0");
  });

  it("Ctrl+A ve ok tuşlarıyla bütün seçimi dünya koordinatında hassas taşır", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "İnci ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.click(screen.getByRole("button", { name: "10 mm noktasına yerleştir" }));
    fireEvent.keyDown(window, { key: "a", ctrlKey: true });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0.5,0,0|10.5,0,0");
    fireEvent.keyDown(window, { key: "ArrowDown", shiftKey: true });
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0.5,5,0|10.5,5,0");
  });

  it("Ctrl+C, Ctrl+V ve Ctrl+D kısayollarını benzersiz kopyalara bağlar", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Kum boncuk ile yerleştirme moduna geç" }));
    await user.click(await screen.findByRole("button", { name: "Orijine yerleştir" }));
    await user.click(screen.getByRole("button", { name: "İlk nesneyi seç" }));
    fireEvent.keyDown(window, { key: "c", ctrlKey: true });
    fireEvent.keyDown(window, { key: "v", ctrlKey: true });
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0,0,0|10,10,0");
    fireEvent.keyDown(window, { key: "d", ctrlKey: true });
    expect(screen.getByTestId("placement-state")).toHaveTextContent("0,0,0|10,10,0|20,20,0");
  });
});

