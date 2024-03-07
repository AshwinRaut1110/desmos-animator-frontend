import Snap from "snapsvg-cjs";
import { VideoCameraIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";

// setting up the calculator
var elt = document.getElementById("calculator");
var calculator = Desmos.GraphingCalculator(elt, { lockViewport: true });
calculator.setMathBounds({
  left: -100,
  right: 7000,
  bottom: -100,
  top: 4500,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function Calculator() {
  const videoInputRef = useRef();

  const [frameBezierEquations, setFrameBezierEquations] = useState("");
  const [videoName, setVideoName] = useState("");
  const [buttonPulse, setButtonPulse] = useState(false);

  // send the video to the backend and get the svg paths
  const handleVideoUpload = async () => {
    const formData = new FormData();

    // adding the video file to be sent to the formData object
    formData.append("video", videoInputRef.current.files[0]);

    setVideoName(""); // reset the video input

    try {
      // get the frames with a fps of 2
      const response = await fetch("http://127.0.0.1:3000/convertVideo?fps=2", {
        method: "POST",
        body: formData,
      });

      // const data = await response.json();
      const frames = await response.json();

      const frameEquations = {};

      // once we get the response convert the svg paths to bezier equations
      for (const frame in frames) {
        const curvePoints = Snap.path.toCubic(frames[frame]);

        frameEquations[frame] = [];

        curvePoints.forEach((curve, index) => {
          const [curveSymbol, x1, y1, x2, y2, x, y] = curve;

          if (curveSymbol !== "C") return;

          // creating cubic bezier equations
          const equation = `(${x1},${y1})(1-t)^3 + 3(${x2},${y2})(1-t)^2t + 3(${x},${y})(1-t)t^2 + (${x},${y})t^3`;

          frameEquations[frame].push({
            id: `exp${index}`,
            color: "#000000",
            latex: equation,
          });
        });
      }

      setFrameBezierEquations(frameEquations);
      setButtonPulse(true); // start run button animation
    } catch (e) {
      console.log(e);
    }
  };

  // run the animation
  const handleRunAnimation = async () => {
    // adding all the frames to the calculator
    for (const frame in frameBezierEquations) {
      // converting the svg paths to get the bezier curve points

      const equations = frameBezierEquations[frame];

      // adding the equation to the calculator
      calculator.setExpressions(equations);

      await sleep(2000);

      // remove all the equations for the current frame from the calculator
      calculator.removeExpressions(equations);
      // for (let index = 0; index < equations.length; index++) {
      //   calculator.removeExpression({ id: `exp${index}` });
      // }
    }
  };

  return (
    <div className="flex p-5 items-center justify-center space-x-4 ">
      <form>
        <label
          // video selection element
          htmlFor="videoInput"
          className="flex flex-col items-center justify-center bg-[#7d7dff] px-[20px] py-[10px] rounded-[5px] cursor-pointer text-white"
        >
          Select Video
          <VideoCameraIcon className="h-8" />
          <input
            id="videoInput"
            type="file"
            className="hidden"
            name="video"
            ref={videoInputRef}
            onChange={() => {
              // change the file name on the selection button when the user selects a file
              setVideoName(videoInputRef.current.files[0].name);
            }}
            accept="video/*" // accept any type of video files
          />
          <span id="videoName">{videoName}</span>
        </label>
      </form>

      <button
        className="w-32 bg-[#7d7dff] py-[10px]  rounded-[5px] cursor-pointer text-white disabled:bg-[#c2c2ff]"
        disabled={videoName === ""}
        onClick={handleVideoUpload}
      >
        Upload Video
      </button>

      <button
        onClick={handleRunAnimation}
        className={`w-32 py-[10px]  rounded-[5px] cursor-pointer text-white disabled:bg-[#c2c2ff] ${
          buttonPulse ? "pulse" : ""
        }`}
        disabled={frameBezierEquations === ""}
      >
        Run Animation
      </button>
    </div>
  );
}

export default Calculator;
