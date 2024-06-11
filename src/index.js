import { useState } from "react";
import ImageUploading from "react-images-uploading";
import { createRoot } from "react-dom/client";
import { saveAs } from "file-saver";

import "./styles.css";

const SUPPORTED_IMAGE_WIDTHS = [512, 762, 1024, 1600, 1920];

function fpTrunc(fp) {
  return Math.round(fp * 10) / 10;
}
function changedArray(array, index, newValue) {
  return array.map((value, i) => i === index ? newValue : value);
}
function runningTotal(array) {
  let runningTotal = [...array];
  for (let i = 1; i < runningTotal.length; i++) {
    runningTotal[i] += runningTotal[i - 1];
  }
  return runningTotal;
}
function exchangeStatistics(outgoing, incoming) {
  let rExchangeDamageVals = [];
  let rExchangeDamageAverages = [];
  let exchangeDamageVals = [0];
  let totalDamage = 0;
  for (let s = 0; s < outgoing.length; s++) {
    totalDamage += outgoing[s];
    if (outgoing[s] > 0) {
      exchangeDamageVals[exchangeDamageVals.length - 1] += outgoing[s];
    } 
    const numExchanges = exchangeDamageVals.length;
    rExchangeDamageVals.push(exchangeDamageVals.at(-1));
    rExchangeDamageAverages.push(fpTrunc(totalDamage / numExchanges));
    if (incoming[s] > 0) {
      exchangeDamageVals.push(0);
    }
  }
  return [rExchangeDamageVals, rExchangeDamageAverages];
}
function isNumeric(str) {
  if (typeof str != "string") return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

function PlayerInput({
  playerIndex, name, setName, damages, setDamages
}) {
  return (
    <div className="fighter-input-container">
      <label className="fighter-label">
        <p className="fighter-actual-label">Fighter {playerIndex}</p>
        <input
          className="fighter-name-input"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>
      <div className="fighter-damages-input-container">
        {damages.map((dmg, i) => <input
          className="fighter-damage-input"
          key={i}
          value={dmg}
          onChange={
            e => {
              if (!isNumeric(e.target.value)) return null;
              const a = parseInt(e.target.value[0]);
              const b = parseInt(e.target.value[1]);
              if (a === b) return null;
              const newValue = damages[i] === a ? b : a;
              setDamages(changedArray(damages, i, newValue));
            }
          }
        />)}
      </div>
    </div>
  );
}
function ComparativeStatsNum({ playerScore, oppScore }) {
  const diff = playerScore - oppScore;
  return (
    <p className="stats-num">
      <span>{playerScore}</span>
      <span
        className="stats-num-comparison"
        color={diff > 0 ? "green" : diff < 0 ? "red" : "dimgray"}
      >&nbsp;({(diff > 0 ? "+" : "")}{fpTrunc(diff)})</span>
    </p>
  );
}
function DamageControlsAndDisplay({
  sceneIndex,
  damages,
  scores,
  setScores,
  runningTotal,
  exDamage,
  avgExDamage,
  oppRunningTotal,
  oppExDamage,
  oppAvgExDamage
}) {
  return (
    <div className="dmg-cell">
      <div className="current-score-and-controls-container">
        <div className="current-score-container stats-container">
          <p className="stats-label">Current</p>
          <p
            color={scores[sceneIndex] === 0 ? "gray" : "black"}
            className="stats-num"
          >{scores[sceneIndex]}</p>
        </div>
        <div className="current-score-selectors">
          {[0, ...damages].map((dmg, i) => (
            <button
              className="score-selector-button"
              key={i}
              onClick={e => setScores(changedArray(scores, sceneIndex, dmg))}
            >{dmg}</button>
          ))}
        </div>
      </div>
      <div className="running-total-score-container stats-container">
        <p className="stats-label">Total</p>
        {/* <p className="stats-num">{runningTotal[sceneIndex]}</p> */}
        <ComparativeStatsNum
          playerScore={runningTotal[sceneIndex]} 
          oppScore={oppRunningTotal[sceneIndex]} />
      </div>
      <div className="exchange-stats-container">
        <div className="exchange-damage-container stats-container">
          <p className="stats-label">Current Exchange</p>
          {/* <p className="stats-num">{exDamage[sceneIndex]}</p> */}
          <ComparativeStatsNum
            playerScore={exDamage[sceneIndex]} 
            oppScore={oppExDamage[sceneIndex]} />
        </div>
        <div className="average-exchange-damage-container stats-container">
          <p className="stats-label">Per Exchange</p>
          {/* <p className="stats-num">{avgExDamage[sceneIndex]}</p> */}
          <ComparativeStatsNum
            playerScore={avgExDamage[sceneIndex]} 
            oppScore={oppAvgExDamage[sceneIndex]} />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [images, setImages] = useState([]);
  const maxNumber = 200;
  const onChange = (imageList, addUpdateIndex) => {
    setImages(imageList);
    setScores1(new Array(imageList.length).fill(0));
    setScores2(new Array(imageList.length).fill(0));
  };

  const [imageWidth, setImageWidth] = useState(512);
  const [name1, setName1] = useState("Sela");
  const [name2, setName2] = useState("Shiraishi");
  const [damages1, setDamages1] = useState([1, 2, 3]);
  const [damages2, setDamages2] = useState([1, 2, 3]);
  const [scores1, setScores1] = useState([]);
  const [scores2, setScores2] = useState([]);

  const runningTotal1 = runningTotal(scores1);
  const runningTotal2 = runningTotal(scores2);
  const [exDamage1, avgExDamage1] = exchangeStatistics(scores1, scores2);
  const [exDamage2, avgExDamage2] = exchangeStatistics(scores2, scores1);

  const [importExportMsg, setImportExportMsg] = useState("");

  function getStateAsJSON() {
    return JSON.stringify({
      name1, name2, damages1, damages2, scores1, scores2
    });
  }

  function loadState(state) {
    setName1(state.name1);
    setName2(state.name2);
    setDamages1(state.damages1);
    setDamages2(state.damages2);
    setScores1(state.scores1);
    setScores2(state.scores2);
  }

  return (
    <div className="App">
      <ImageUploading
        multiple
        value={images}
        onChange={onChange}
        maxNumber={maxNumber}
        dataURLKey="data_url"
        acceptType={["jpg", "png"]}
      >
        {({
          imageList,
          onImageUpload,
          onImageRemoveAll,
          onImageUpdate,
          onImageRemove,
          isDragging,
          dragProps
        }) => (
          <div className="page-container">
            <div className="upload-remove-container">
              {images.length === 0 ? (<button
                style={isDragging ? {
                  textDecoration: "underline",
                  color: "blue"
                } : null}
                className="drag-button std-button"
                onClick={onImageUpload}
                {...dragProps}
              >
                Click or drag here
              </button>) : null}
              <button
                className="remove-button std-button"
                onClick={onImageRemoveAll}
              >
                Remove all images
              </button>
            </div>

            {images.length ? (
              <>
                <div className="settings-container">
                  <div className="image-width-chooser">
                    <p className="label">Image width: </p>
                    <div className="options">
                      {SUPPORTED_IMAGE_WIDTHS.map((width, i) => (
                        <label key={i}>
                          <input 
                            type="radio"
                            value={width}
                            checked={width === imageWidth}
                            onChange={e => setImageWidth(width)}
                          />
                          <p>{width}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="import-export-wrapper">
                    <div className="import-export-container">
                      <div className="export-container">
                        <button
                          className="export-button"
                          onClick={e => {
                            const blob = new Blob([getStateAsJSON()], {
                              type: "application/json"
                            });
                            const filename = `${name1} vs ${name2}.json`;
                            saveAs(blob, filename);
                            setImportExportMsg(`Successfully exported as ${filename}`)
                          }}
                        >Export Fight</button>
                      </div>
                      <div className="import-container">
                        <input
                          className="import-button"
                          type="file"
                          accept="application/json"
                          onChange={e => {
                            const file = e.target.files[0];
                            file.text().then(contents => {
                              const state = JSON.parse(contents);
                              if (state.scores1.length !== scores1.length) {
                                setImportExportMsg(`Current # of scenes don't match
                                the imported # of scenes`);
                                return;
                              }
                              setImportExportMsg(`Successfully imported fight`);
                              loadState(state);
                            }, (reason) => {
                              setImportExportMsg(`Cannot read ${file.name}. See console`);
                              console.log(reason);
                            })
                          }}
                        />
                      </div>
                    </div>
                    <p className="import-export-status">{importExportMsg}</p>
                  </div>
                </div>

                <div className="players-input-container">
                  <PlayerInput
                    playerIndex={1}
                    name={name1}
                    setName={setName1}
                    damages={damages1}
                    setDamages={setDamages1}
                  />
                  <PlayerInput
                    playerIndex={2}
                    name={name2}
                    setName={setName2}
                    damages={damages2}
                    setDamages={setDamages2}
                  />
                </div>

                <table className="main-table">
                  <thead>
                    <tr>
                      <th scope="col"></th>
                      <th scope="col"></th>
                      <th scope="col">{name1}</th>
                      <th scope="col">{name2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imageList.map((image, index) => (
                      <tr key={index}>
                        <td className="image-row-number">{index}</td>
                        <td className="image-item">
                          <img src={image.data_url} alt="" width={imageWidth} />
                        </td>
                        <td>
                          <DamageControlsAndDisplay
                            sceneIndex={index}
                            damages={damages1}
                            scores={scores1}
                            setScores={setScores1}
                            runningTotal={runningTotal1}
                            exDamage={exDamage1}
                            avgExDamage={avgExDamage1}
                            oppRunningTotal={runningTotal2}
                            oppExDamage={exDamage2}
                            oppAvgExDamage={avgExDamage2}
                          />
                        </td>
                        <td>
                          <DamageControlsAndDisplay
                            sceneIndex={index}
                            damages={damages2}
                            scores={scores2}
                            setScores={setScores2}
                            runningTotal={runningTotal2}
                            exDamage={exDamage2}
                            avgExDamage={avgExDamage2}
                            oppRunningTotal={runningTotal1}
                            oppExDamage={exDamage1}
                            oppAvgExDamage={avgExDamage1}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>


              </>
            ) : null}
          </div>
        )}
      </ImageUploading>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(<App />);
