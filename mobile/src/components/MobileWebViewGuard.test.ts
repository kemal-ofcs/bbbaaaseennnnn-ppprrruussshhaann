import { describe, expect, test } from "bun:test";
import { bolehMenuKonteks, perluCegahSeret } from "./MobileWebViewGuard";

class ElemenUji extends EventTarget {
  readonly tagName: string;
  readonly parentElement: ElemenUji | null;
  readonly className: string;
  private readonly atribut: Record<string, string>;

  constructor(
    tag: string,
    opsi: {
      atribut?: Record<string, string>;
      parent?: ElemenUji | null;
      className?: string;
    } = {},
  ) {
    super();
    this.tagName = tag.toUpperCase();
    this.parentElement = opsi.parent ?? null;
    this.atribut = opsi.atribut ?? {};
    this.className = opsi.className ?? this.atribut.class ?? "";
  }

  getAttribute(nama: string): string | null {
    return Object.hasOwn(this.atribut, nama) ? this.atribut[nama] : null;
  }
}

class TeksUji extends EventTarget {
  readonly parentElement: ElemenUji | null;

  constructor(parent: ElemenUji | null) {
    super();
    this.parentElement = parent;
  }
}

describe("bolehMenuKonteks", () => {
  test("memblokir tautan, gambar, tombol, kontainer umum, dan elemen/teks di dalam tautan", () => {
    const tautan = new ElemenUji("a", { atribut: { href: "/menu" } });
    const teksDalamTautan = new TeksUji(tautan);
    const spanDalamTautan = new ElemenUji("span", { parent: tautan });
    const kodeDalamTautan = new ElemenUji("code", { parent: tautan });
    const gambar = new ElemenUji("img");
    const tombol = new ElemenUji("button");
    const kotak = new ElemenUji("div");

    expect(bolehMenuKonteks(null)).toBe(false);
    expect(bolehMenuKonteks(tautan)).toBe(false);
    expect(bolehMenuKonteks(teksDalamTautan)).toBe(false);
    expect(bolehMenuKonteks(spanDalamTautan)).toBe(false);
    expect(bolehMenuKonteks(kodeDalamTautan)).toBe(false);
    expect(bolehMenuKonteks(gambar)).toBe(false);
    expect(bolehMenuKonteks(tombol)).toBe(false);
    expect(bolehMenuKonteks(kotak)).toBe(false);
  });

  test("mengizinkan input, textarea, code, pre, contenteditable, dan penanda eksplisit", () => {
    const input = new ElemenUji("input");
    const textarea = new ElemenUji("textarea");
    const kode = new ElemenUji("code");
    const teksDalamKode = new TeksUji(kode);
    const pre = new ElemenUji("pre");
    const barisPre = new ElemenUji("span", { parent: pre });
    const editor = new ElemenUji("div", {
      atribut: { contenteditable: "true" },
    });
    const anakEditor = new ElemenUji("span", { parent: editor });
    const izinKonteks = new ElemenUji("div", {
      atribut: { "data-allow-contextmenu": "true" },
    });
    const dapatDipilih = new ElemenUji("span", {
      atribut: { "data-selectable": "true" },
    });
    const kodePemulihan = new ElemenUji("li", {
      className: "select-all rounded-xl font-mono",
    });

    expect(bolehMenuKonteks(input)).toBe(true);
    expect(bolehMenuKonteks(textarea)).toBe(true);
    expect(bolehMenuKonteks(kode)).toBe(true);
    expect(bolehMenuKonteks(teksDalamKode)).toBe(true);
    expect(bolehMenuKonteks(pre)).toBe(true);
    expect(bolehMenuKonteks(barisPre)).toBe(true);
    expect(bolehMenuKonteks(editor)).toBe(true);
    expect(bolehMenuKonteks(anakEditor)).toBe(true);
    expect(bolehMenuKonteks(izinKonteks)).toBe(true);
    expect(bolehMenuKonteks(dapatDipilih)).toBe(true);
    expect(bolehMenuKonteks(kodePemulihan)).toBe(true);
  });
});

describe("perluCegahSeret", () => {
  test("mencegah seret pada tautan, gambar, dan elemen di dalam tautan", () => {
    const tautan = new ElemenUji("a");
    const ikonDalamTautan = new ElemenUji("span", { parent: tautan });
    const teksDalamTautan = new TeksUji(tautan);
    const gambar = new ElemenUji("img");
    const input = new ElemenUji("input");
    const kotak = new ElemenUji("div");

    expect(perluCegahSeret(tautan)).toBe(true);
    expect(perluCegahSeret(ikonDalamTautan)).toBe(true);
    expect(perluCegahSeret(teksDalamTautan)).toBe(true);
    expect(perluCegahSeret(gambar)).toBe(true);
    expect(perluCegahSeret(input)).toBe(false);
    expect(perluCegahSeret(kotak)).toBe(false);
    expect(perluCegahSeret(null)).toBe(false);
  });
});
