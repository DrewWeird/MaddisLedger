import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Extracted directly from logo.png (Maddi's Sweet Temptations branding).
// Generated with @mantine/colors-generator so each brand hex lands as one full shade
// in a harmonious 10-step ramp, rather than being used as a raw one-off color.
const maddisBlue: MantineColorsTuple = [
  '#e6f8ff', '#d2edfc', '#a5d9f7', '#75c4f2', '#50b3ee',
  '#3ba8ed', '#2da2ed', '#1f8ed3', '#0b78b5', '#006da8',
];

const maddisOrange: MantineColorsTuple = [
  '#fff4e3', '#ffe7cf', '#fbcda0', '#f8b26c', '#f59b41',
  '#f48d26', '#f48516', '#e1760a', '#c26503', '#a95500',
];

const maddisRed: MantineColorsTuple = [
  '#ffe9eb', '#ffd0d2', '#fd9da2', '#fc676f', '#fc3c44',
  '#fc2329', '#fd171b', '#e20a10', '#d6000d', '#b00007',
];

export const theme = createTheme({
  primaryColor: 'maddisBlue',
  primaryShade: { light: 8, dark: 6 },
  colors: {
    maddisBlue,
    maddisOrange,
    maddisRed,
  },
});

// The validated categorical order for charts with 2-3 series (revenue/COGS/expenses etc).
// Dark-mode orange is a separate, darker step of the same hue — the light-mode brand
// orange is too light to clear the dark-surface lightness band, per the dataviz skill's
// validator (references/palette.md in the dataviz skill).
export const chartColors = {
  light: { blue: '#0b78b5', orange: '#e1760a', red: '#d6000d' },
  dark: { blue: '#0b78b5', orange: '#c98500', red: '#d6000d' },
};
