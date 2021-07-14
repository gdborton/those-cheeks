import React from "react";
import { Box, Text } from "ink";
import getCharacterFromRemainders from "./getSpectrumCharacter";
import chunk from "chunk";
import chalk from "chalk";

const stylizers = {};

function stylize(text: string, lineNumber, height) {
  const key = `${lineNumber / height}`;
  if (!stylizers[key]) {
    const [red, green, blue] = color(lineNumber, height);
    stylizers[key] = chalk.rgb(red, green, blue);
  }

  return stylizers[key](text);
}

function color(value, maxValue) {
  const lowestColor = [5, 255, 250];
  const secondLowestColor = [100, 247, 150];
  const secondHighestColor = [255, 200, 100];
  const highestColor = [250, 38, 100];
  let percent = 0;
  let color1 = lowestColor;
  let color2 = secondLowestColor;
  const percentFilled = value / (maxValue - 1);
  const lowThreshold = 0.33;
  const medThreshold = 0.66;
  if (percentFilled <= lowThreshold) {
    color1 = lowestColor;
    color2 = secondLowestColor;
    percent = percentFilled / lowThreshold;
  } else if (percentFilled <= medThreshold) {
    color1 = secondLowestColor;
    color2 = secondHighestColor;
    percent = (percentFilled - lowThreshold) / (medThreshold - lowThreshold);
  } else {
    color1 = secondHighestColor;
    color2 = highestColor;
    percent = Math.min(
      1,
      ((percentFilled - medThreshold) / (1 - medThreshold)) * 2
    );
  }
  const red = Math.min(
    Math.ceil(color1[0] + percent * (color2[0] - color1[0])),
    255
  );
  const green = Math.min(
    Math.ceil(color1[1] + percent * (color2[1] - color1[1])),
    255
  );
  const blue = Math.min(
    Math.ceil(color1[2] + percent * (color2[2] - color1[2])),
    255
  );
  return [red, green, blue];
}

export default function Spectrum({
  spectrum,
  height = 10,
}: {
  spectrum: number[];
  height: number;
  width: number;
}) {
  return (
    <Text>
      {Array.apply(null, Array(height)).map((_, lineNumber) => {
    const line = chunk(spectrum, 2).map(([leftVal, rightVal], index) => {
      const char = getCharacterFromRemainders(
        leftVal * height - (height - lineNumber),
        rightVal * height - (height - lineNumber),
        lineNumber === height - 1
      );
      return char;
    }).join('').replace(/\⠀+$/g, '') + '\n';
    return stylize(line, height - lineNumber, height);
  }).join('')}
    </Text>
  );
}
