import React, { FC, useEffect, useState } from "react";
import { Text } from "ink";
import soundcloudKeyFetch from "soundcloud-key-fetch";
import lame from "@suldashi/lame";
import got from "got";
import Speaker from "speaker";

import { bufferToUInt8, createSpectrumsProcessor } from "./audio";
import useStdoutDimensions from "ink-use-stdout-dimensions";
import Spectrum from "./Spectrum";
const FPS = 20;

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
  callback: (frame: number, audioDataParser: () => number[]) => void
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
    const audioDuration = 136.008;
    const framesCount = Math.trunc(audioDuration * FPS);
    const audioDataStep = Math.trunc(buffer.length / framesCount);
    got.stream(response.body.url).pipe(decoder);
  }
}

const App: FC = () => {
  const [columns, rows] = useStdoutDimensions();
  const baseSpectrum = Array.apply(null, Array(columns)).map(() => 0);
  const [spectrumProcessor, setSpectrumProcessor] = useState({
    processor: undefined,
  });
  const [frameData, setFrameData] = useState({
    frame: 0,
    audioDataParser: () => baseSpectrum,
  });
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
      <Spectrum height={25} width={columns} spectrum={spectrum} />
      <Text>
        Ken Wheeler - Those Cheeks {Math.floor(seconds / 60)}:
        {(seconds % 60).toString().padStart(2, "0")}
      </Text>
    </>
  );
};

export default App;
