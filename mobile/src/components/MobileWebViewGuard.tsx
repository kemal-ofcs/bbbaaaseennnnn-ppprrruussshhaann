"use client";

import { useEffect } from "react";

interface SimpulTarget {
  tagName?: unknown;
  parentElement?: SimpulTarget | null;
  isContentEditable?: unknown;
  getAttribute?: (nama: string) => string | null;
  dataset?: Record<string, string | undefined>;
  classList?: { contains?: (kelas: string) => boolean };
  className?: unknown;
}

const TAG_IZIN_MENU_KONTEKS = new Set(["INPUT", "TEXTAREA", "CODE", "PRE"]);
const TAG_CEGAH_SERET = new Set(["A", "IMG"]);

function keElemenAwal(target: EventTarget | null): SimpulTarget | null {
  if (!target || typeof target !== "object") return null;
  const simpul = target as SimpulTarget;
  if (typeof simpul.tagName === "string") return simpul;
  return simpul.parentElement ?? null;
}

function bacaAtribut(simpul: SimpulTarget, nama: string): string | null {
  return typeof simpul.getAttribute === "function"
    ? simpul.getAttribute(nama)
    : null;
}

function punyaKelasSelectAll(simpul: SimpulTarget): boolean {
  if (typeof simpul.classList?.contains === "function") {
    return simpul.classList.contains("select-all");
  }
  const mentah =
    bacaAtribut(simpul, "class") ??
    (typeof simpul.className === "string" ? simpul.className : "");
  return /(?:^|\s)select-all(?:\s|$)/.test(mentah);
}

function elemenBolehSalin(simpul: SimpulTarget, tag: string): boolean {
  if (TAG_IZIN_MENU_KONTEKS.has(tag)) return true;
  const editable = bacaAtribut(simpul, "contenteditable")?.toLowerCase();
  if (
    simpul.isContentEditable === true ||
    editable === "true" ||
    editable === ""
  ) {
    return true;
  }
  return (
    bacaAtribut(simpul, "data-selectable") === "true" ||
    simpul.dataset?.selectable === "true" ||
    punyaKelasSelectAll(simpul)
  );
}

// Menu konteks Android hanya pada form dan teks kode/token di luar tautan.
export function bolehMenuKonteks(target: EventTarget | null): boolean {
  let simpul = keElemenAwal(target);
  let diizinkan = false;

  while (simpul && typeof simpul.tagName === "string") {
    if (
      bacaAtribut(simpul, "data-allow-contextmenu") === "true" ||
      simpul.dataset?.allowContextmenu === "true"
    ) {
      return true;
    }
    const tag = simpul.tagName.toUpperCase();
    if (tag === "A") return false;
    if (!diizinkan && elemenBolehSalin(simpul, tag)) {
      diizinkan = true;
    }
    simpul = simpul.parentElement ?? null;
  }

  return diizinkan;
}

export function perluCegahSeret(target: EventTarget | null): boolean {
  let simpul = keElemenAwal(target);
  while (simpul && typeof simpul.tagName === "string") {
    if (TAG_CEGAH_SERET.has(simpul.tagName.toUpperCase())) return true;
    simpul = simpul.parentElement ?? null;
  }
  return false;
}

export function MobileWebViewGuard() {
  useEffect(() => {
    const saatMenuKonteks = (event: MouseEvent) => {
      if (!bolehMenuKonteks(event.target)) {
        event.preventDefault();
      }
    };

    const saatMulaiSeret = (event: DragEvent) => {
      if (perluCegahSeret(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", saatMenuKonteks);
    document.addEventListener("dragstart", saatMulaiSeret);

    return () => {
      document.removeEventListener("contextmenu", saatMenuKonteks);
      document.removeEventListener("dragstart", saatMulaiSeret);
    };
  }, []);

  return null;
}
