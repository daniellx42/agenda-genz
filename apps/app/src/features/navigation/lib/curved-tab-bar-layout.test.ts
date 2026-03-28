import { describe, expect, it } from "bun:test";
import {
  getCurvedTabBarBottomOffset,
  getCurvedTabBarHeight,
} from "./curved-tab-bar-layout";

describe("curved tab bar layout", () => {
  it("mantem um respiro minimo quando o inset inferior eh pequeno", () => {
    expect(getCurvedTabBarBottomOffset(0)).toBe(20);
    expect(getCurvedTabBarBottomOffset(8)).toBe(20);
  });

  it("acompanha o inset inferior real do sistema", () => {
    expect(getCurvedTabBarBottomOffset(34)).toBe(42);
    expect(getCurvedTabBarBottomOffset(48)).toBe(56);
  });

  it("reserva espaco suficiente para a barra e o botao central", () => {
    expect(getCurvedTabBarHeight(0)).toBe(128);
    expect(getCurvedTabBarHeight(34)).toBe(150);
    expect(getCurvedTabBarHeight(48)).toBe(164);
  });
});
