export const CURVED_TAB_BAR_HEIGHT = 66;
export const CURVED_TAB_BAR_FAB_SIZE = 64;

const MIN_BOTTOM_OFFSET = 12;
const EXTRA_BOTTOM_SPACING = 8;
const CURVED_TAB_BAR_CLEARANCE = 12;
const FAB_VISIBLE_HEIGHT =
  CURVED_TAB_BAR_HEIGHT + CURVED_TAB_BAR_FAB_SIZE / 2 - 2;

export function getCurvedTabBarBottomOffset(bottomInset: number) {
  return Math.max(bottomInset, MIN_BOTTOM_OFFSET) + EXTRA_BOTTOM_SPACING;
}

export function getCurvedTabBarHeight(bottomInset: number) {
  return (
    getCurvedTabBarBottomOffset(bottomInset) +
    FAB_VISIBLE_HEIGHT +
    CURVED_TAB_BAR_CLEARANCE
  );
}
