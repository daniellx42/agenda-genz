import { describe, expect, it } from "bun:test";
import { formatInstagram, formatInstagramDisplay } from "./text";

describe("formatInstagram", () => {
  it("extrai o handle quando o usuário cola a url completa", () => {
    expect(formatInstagram("https://www.instagram.com/ana_weiss_nails/")).toBe(
      "ana_weiss_nails",
    );
  });

  it("remove arroba e caracteres inválidos", () => {
    expect(formatInstagram("@Ana.Weiss_Nails!!")).toBe("ana.weiss_nails");
  });
});

describe("formatInstagramDisplay", () => {
  it("mostra o handle com arroba", () => {
    expect(formatInstagramDisplay("ana_weiss_nails")).toBe(
      "@ana_weiss_nails",
    );
  });
});
