/// This is intentionally one pixel less than `theme.breakpoints.values.ext`,
/// so that is returns true on `theme.breakpoints.down(theme.breakpoints.values.ext)`,
/// which checks that width is [0, 451).
/// Because it does not include the upper bound, the breakpoints is 450 + 1 = 451.
export const EXTENSION_WIDTH = "450px";
