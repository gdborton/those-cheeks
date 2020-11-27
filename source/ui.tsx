import React, { FC, useEffect, useState } from "react";
import { Box, render, Text, Transform } from "ink";
import soundcloudKeyFetch from "soundcloud-key-fetch";
import lame from "@suldashi/lame";
import got from "got";
import Speaker from "speaker";

import { bufferToUInt8, createSpectrumsProcessor } from "./audio";
import useStdoutDimensions from "ink-use-stdout-dimensions";
const FPS = 20;

const spectrumBusesCount = 64 * 2; // number of bars to show in visualizer

type UserStreamsResponse = {
  collection: {
    type: "track" | string;
    track?: {
      id: number;
      media: {
        transcodings: {
          url: string;
          format: {
            protocol: "progressive" | string;
          };
        }[];
      };
    };
  }[];
};

type TranscodingUrlResponse = {
  url: string;
};
const PCM_FORMAT = {
  bit: 8,
  sign: "u",
  parseFunction: bufferToUInt8,
};

async function sideEffects(
	callback: (frame: number, audioDataParser: () => number[]) => void,
) {
  const key = await soundcloudKeyFetch.fetchKey();
  const response = await got<UserStreamsResponse>(
    `https://api-v2.soundcloud.com/stream/users/2173404?limit=40&client_id=${key}&app_version=1606403857&app_locale=en`,
    {
      responseType: "json",
    }
  );
  const item = response.body.collection.find((item) => {
    if (!item.track) return false;
    return item.type === "track" && item.track.id === 691418836;
  });
  if (!item) return;
  const transcoding = item.track?.media.transcodings.find(
    (transcoding) => transcoding.format.protocol === "progressive"
  );
  if (transcoding) {
    const response = await got<TranscodingUrlResponse>(
      `${transcoding.url}?client_id=${key}`,
      {
        responseType: "json",
      }
    );
    const decoder = lame.Decoder();
    decoder.on("format", (format: any) => {
      const s = new Speaker(format);
			const start = Date.now();
			let shouldRender = true;
			function renderFrame() {
				const elapsedTime = Date.now() - start;
				const audioDataParser = () => {
          const frame = Math.floor((elapsedTime / 1000) * FPS);
					return PCM_FORMAT.parseFunction(
						buffer,
						frame * audioDataStep,
						frame * audioDataStep + audioDataStep
					);
				};

				try {
					callback(Math.floor((elapsedTime / 1000) * FPS), audioDataParser);
				} catch (e) {
					console.log("yack", e);
				}
				if (shouldRender) {
					setTimeout(renderFrame, 1000 / FPS);
				} else {

				}
			}
			renderFrame();
      decoder.on("end", () => {
				shouldRender = false;
        console.log("all done", Date.now() - start);
      });
      let totalProcessed = 0;
      decoder.on("data", (chunk) => {
        totalProcessed += chunk;
        // console.log(chunk.length);
      });
      decoder.pipe(s);
    });

    const streamResponse = await got(response.body.url, {
      responseType: "buffer",
    });
    const buffer = streamResponse.body;

    /**
     * hmmm
     */
    const format = {
      raw_encoding: 208,
      sampleRate: 44100,
      channels: 2,
      signed: true,
      float: false,
      ulaw: false,
      alaw: false,
      bitDepth: 16,
    };
    const audioDuration = 40.008;
    const framesCount = Math.trunc(audioDuration * FPS);
    const audioDataStep = Math.trunc(buffer.length / framesCount);
    got.stream(response.body.url).pipe(decoder);
  }
}

function Spectrum({
  spectrum,
  height = 10,
  width = 10,
}: {
  spectrum: number[];
  height: number;
  width: number;
}) {
  const lines = [];
  const lowestColor = [5, 223, 215];
  const secondLowestColor = [163, 247, 191];
  const secondHighestColor = [255, 245, 145];
  const highestColor = [250, 38, 160];
  while (lines.length < height) {
    const line = spectrum.map((val) => {
      if (Math.floor(val * height) >= lines.length) {
        // blocks...
        // https://en.wikipedia.org/wiki/Block_Elements
        // return '█'; // full
        return "▊"; // 3/4 width
      }
      return " ";
    });
    const lineString = line.join("");
    if (lineString.length > width) {
      // console.log('bugger off', lineString.length, width, spectrum.length);
    }
    lines.push(line.join(""));
  }
  return (
    <Box flexDirection="column-reverse">
      {lines.map((line, index) => {
        let percent = 0;
        let color1 = lowestColor;
        let color2 = secondLowestColor;
        const percentFilled = index / (height - 1);
        if (percentFilled < 0.33) {
          color1 = lowestColor;
          color2 = secondLowestColor;
          percent = percentFilled / 0.33;
        } else if (index / (height - 1) < 0.66) {
          color1 = secondLowestColor;
          color2 = secondHighestColor;
          percent = (percentFilled - 0.33) / 0.33;
        } else {
          color1 = secondHighestColor;
          color2 = highestColor;
          percent = (percentFilled - 0.66) / 0.33;
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
        return (
          <Text color={`rgb(${red}, ${green}, ${blue})`} key={index}>
            {line}
          </Text>
        );
      })}
    </Box>
  );
}
const start = Date.now();
const App: FC = () => {
  const [columns, rows] = useStdoutDimensions();
  // const columns = 64 * 2;
  const baseSpectrum = Array.apply(null, Array(columns)).map(() => 0);
  const [spectrumProcessor, setSpectrumProcessor] = useState({
    processor: undefined,
	});
  const [frameData, setFrameData] = useState({
		frame: 0,
    audioDataParser: () => baseSpectrum,
  });
  // const [audioDataParser, setAudioDataParser] = useState<number[]>();
  // const [frame, setFrame] = useState(0);
  useEffect(() => {
    sideEffects((frame, audioDataParser) => {
      setFrameData({
				frame,
				audioDataParser,
      });
    });
  }, []);
  useEffect(() => {
    setSpectrumProcessor({
      processor: createSpectrumsProcessor(columns),
    });
  }, [columns]);
  let spectrum = baseSpectrum;

  try {
    if (spectrumProcessor.processor) {
      spectrum = spectrumProcessor.processor(frameData.audioDataParser);
    }
  } catch (e) {
    // console.log("error", e);
  }
  const seconds = Math.floor(frameData.frame / FPS);
  return (
		<>
			<Spectrum height={15} width={columns} spectrum={spectrum} />
	<Text>Ken Wheeler - Those Cheeks {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')} {Date.now() - start}</Text>
		</>
	);
};

export default App;
