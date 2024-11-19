import "./App.css";
import axios from "axios";
import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

function copyURL(event) {
  var buttonId = event.target.id;
  var copyText = document.getElementById(buttonId.slice(0, -6));
  navigator.clipboard.writeText(copyText.href);
}

function App() {
  const [inputText, setInputText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [numResults, setNumResults] = useState(5);
  const [data, setData] = useState(null);

  // Send input text to backend server and find most relevant articles
  const handleSearch = () => {
    axios
      .post("http://127.0.0.1:5000/api/data", {
        query: inputText,
        num_results: numResults,
      })
      .then((response) => setData(response.data.result), setShowResult(true))
      .catch((error) => console.error("Error fetching data:", error));
  };

  // Go back to the input page
  const goBack = () => {
    setShowResult(false);
    setData(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>Background Link Finder</p>
      </header>
      <body className="App-body">
        <div>
          {/* Display the search result or the input page */}
          {showResult ? (
            <>
              {data ? (
                <>
                  <br />
                  <Tabs>
                    <TabList>
                      <Tab>Table</Tab>
                      <Tab>Text info</Tab>
                    </TabList>

                    {/* Go through returned data list, iterate through each article and then display them */}
                    <TabPanel>
                      <table className="ResultTable">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Title/URL</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((article, i) => (
                            <tr key={i}>
                              <td>{article[0]}</td>
                              <td>
                                <a id={i} href={article[2]}>
                                  {article[1]}
                                </a>
                              </td>
                              <td>
                                <button
                                  id={i + "Button"}
                                  className="URL-button"
                                  onClick={(event) => copyURL(event)}
                                >
                                  Copy URL
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TabPanel>
                    <TabPanel>
                      <h2>Any content 2</h2>
                    </TabPanel>
                  </Tabs>

                  <button className="Button" onClick={goBack}>
                    Back
                  </button>
                </>
              ) : (
                <>
                  <p>Loading...</p>
                </>
              )}
            </>
          ) : (
            <>
              <p>Enter article contents:</p>
              <textarea
                name="inputArticle"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={20}
                cols={100}
                style={{ borderRadius: "5px" }}
              />
              <br />
              <p>
                Number of results:{" "}
                <select
                  value={numResults}
                  onChange={(e) => setNumResults(parseInt(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                </select>
                <button className="Button" onClick={handleSearch}>
                  Search
                </button>
              </p>
            </>
          )}
        </div>
      </body>
    </div>
  );
}

export default App;
