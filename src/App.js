import "./App.css";
import axios from "axios";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import Quill from "quill";
import "quill/dist/quill.snow.css";


function copyURL(event) {
  var button = event.target;
  var buttonId = event.target.id;
  var copyText = document.getElementById(buttonId.slice(0, -6));
  navigator.clipboard.writeText(copyText.href).then(() => {
    button.textContent = "Copied!";

    document.querySelectorAll(".URL-button").forEach((btn) => {
      if (btn !== button) {
        btn.textContent = "Copy URL";
      }
    });

    setTimeout(() => {
      button.textContent = "Copy URL";
    }, 2000);
  });
}

// Get user highlighted text to add a link to
function getSelectionText() {
  let text = "";

  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== "Control") {
    text = document.selection.createRange().text;
  }

  return text;
}

function App() {
  const [inputText, setInputText] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [method, setMethod] = useState("title");
  const [showResult, setShowResult] = useState(false);
  const [numResults, setNumResults] = useState(5);
  const [data, setData] = useState(null);
  const [selectedText, setSelectedText] = useState("");
  const [showError, setShowError] = useState(false);
  const [quillInitialized, setQuillInitialized] = useState(false);
  // const [editorReady, setEditorReady] = useState(false);
  // const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);

  const handleTabSelect = (i) => {
    setActiveTab(i);
  };

  const handleSelection = () => {
    const text = getSelectionText();
    setSelectedText(text);
  };

  function sanitizeString(str) {
    str = str.replace(/[^a-z0-9áéíóúñü \\.,_-]/gim, "");
    return str.trim();
  };

  // Send input text to backend server and find most relevant articles
  const handleSearch = () => {
    setShowResult(true);
    setActiveTab(0);
    axios
      .post("http://127.0.0.1:5000/api/data", { title: sanitizeString(inputTitle), body: sanitizeString(inputText), num_results: numResults, method: method })
      .then((response) => { setData(response.data.result) })
      .catch((error) => { console.error("Error fetching data:", error); setShowResult(true); setActiveTab(0); setShowError(true) });

    // setEditorReady(true);
  };

  // Go back to the input page
  const goBack = () => {
    setShowResult(false);
    setData(null);
    setActiveTab(null);
    setShowError(false);
    setQuillInitialized(false);
    // setEditorReady(false);
    if (quillRef.current) {
      quillRef.current = null;
    }
  };

  useLayoutEffect(() => {
    // Initialize Quill only when the editor tab is active
    if (activeTab === 0 && !quillRef.current) {
      const editorElement = document.getElementById("editor");
      if (editorElement) {
        quillRef.current = new Quill(editorElement, {
          modules: { toolbar: false },
          theme: "snow",
        });
        quillRef.current.setText(inputText); // Initialize with text
        setQuillInitialized(true);
      }
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
        setQuillInitialized(false);
      }
    };
  }, [activeTab]);

  // useEffect(() => {
  //   if (quillInitialized && quillRef.current) {
  //     quillRef.current.setText(inputText); // Update text when quillInitialized changes
  //   }
  // }, [quillInitialized]);

  // useEffect(() => {
  //   if (activeTab === 0 && quillRef.current) {
  //     quillRef.current.setText(inputText); // Ensure Quill updates with new inputText
  //   }
  // }, [activeTab]);

  // useLayoutEffect(() => {
  //   const editorElement = document.getElementById("editor");

  //   if (activeTab === 0 && editorElement) {
  //     if (!quillRef.current) {
  //       quillRef.current = new Quill(editorElement, {
  //         modules: { toolbar: false },
  //         theme: "snow",
  //       });
  //     }
  //     quillRef.current.setText(inputText); // Ensure Quill updates with new inputText
  //   }
  // }, [activeTab, inputText]); // Depend on both activeTab and inputText



  // useEffect(() => {
  //   console.log("EditorRef:", editorRef.current); // This should not be null when showResult is true
  // }, [editorRef.current]);


  // Handle making the selected text a link
  const linkSelectedText = (event) => {
    const quill = quillRef.current;
    const range = quill.getSelection();
    var buttonId = event.target.id;
    var copyText = document.getElementById(buttonId.slice(0, -6));
    if (range && range.length > 0) {
      quill.formatText(range.index, range.length, "link", copyText.href);
    } else {
      alert("Please select text to link.");
    }
  };

  const resetLinks = () => {
    const quill = quillRef.current;
    if (!quill) return;
    const length = quill.getLength();
    quill.formatText(0, length, "link", false);
  };


  const resetSelectedLink = () => {
    const quill = quillRef.current;
    const range = quill.getSelection();
    if (range && range.length > 0) {
      quill.formatText(range.index, range.length, "link", false);
    }
  }

  const updateLinkStatus = (url, status, query) => {
    axios
      .post("http://127.0.0.1:5000/api/update_link", { status: status, query: query, url: url })
      .then((response) => { console.log(response.data.message); })
      .catch((error) => console.error("Error updating link:", error));
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>Background Link Finder</p>
      </header>
      <body className="App-body">
        <div>
          {/* Display the search result, error or the input page */}
          {showResult ? (
            <>
              {showError ? (
                <>
                  <p>Error getting links!</p>
                  <p>Please click back to try again:</p>
                  <button className="Button" onClick={goBack}>Back</button>
                </>
              ) : (
                <>
                  {data ? (
                    <>
                      <br />
                      <Tabs onSelect={(i) => handleTabSelect(i)} forceRenderTabPanel>
                        <TabList>
                          <Tab>Input Document</Tab>
                          <Tab>Table/Link Articles</Tab>
                        </TabList>

                        <TabPanel>
                          <div style={{ display: "grid", alignItems: "center", gridGap: 10, columnGap: 100, paddingLeft: "10%" }}>
                            {data.map((article, i) => (
                              <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>

                                <button
                                  id={i + "GoodButton"}
                                  className="good-button"
                                  onClick={() => updateLinkStatus(article[2], "good", inputText)}>
                                  👍
                                </button>
                                <button
                                  id={i + "BadButton"}
                                  className="bad-button"
                                  onClick={() => updateLinkStatus(article[2], "bad", inputText)}>
                                  👎
                                </button>

                                <button
                                  id={i + "Button"}
                                  className="Link-button"
                                  onClick={(event) => linkSelectedText(event)}>
                                  Link
                                </button>

                                <span>{article[0]}</span>
                                <a id={i} href={article[2]}>
                                  {article[1]}
                                </a>

                                <button
                                  id={i + "Button"}
                                  className="URL-button"
                                  onClick={(event) => copyURL(event)}>
                                  Copy URL
                                </button>

                              </div>))}
                          </div>

                          <button className="Button" onClick={resetLinks}>Remove All Links</button>
                          <button className="Button" onClick={resetSelectedLink}>Remove Selected Link</button>
                          <button className="Button" onClick={goBack}>Back</button>
                          {showResult && (
                            <div
                              key={activeTab === 0 ? "editor-active" : "editor-inactive"}
                              id="editor"
                              style={{
                                minHeight: "100px",
                                width: "90%",
                                margin: "auto",
                                border: "1px solid #ccc",
                              }}
                            />
                          )}
                        </TabPanel>

                        <TabPanel>
                          <p onMouseUp={handleSelection}>{inputText}</p>
                          <p>Selected text: {selectedText}</p>
                          <button className="Button" onClick={goBack}>Back</button>
                        </TabPanel>

                      </Tabs>
                    </>
                  ) : (
                    <p>Loading...</p>
                  )}
                </>
              )}
            </>
          ) : (
            <><div style={{ display: "grid", alignItems: "center", gridGap: 10, columnGap: 100, gridTemplateColumns: "repeat(2, 1fr)" }}>

            {/* <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}> */}
              Enter article title:
              <textarea
                name="inputTitle"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                rows={2}
                cols={100}
                style={{ borderRadius: "5px" }}
              />
            {/* </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}> */}
              Enter article contents:
              <textarea
                name="inputArticle"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={20}
                cols={100}
                style={{ borderRadius: "5px" }}
              />
            {/* </div> */}
              <div>
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
                &nbsp;Search method:&nbsp;
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}>
                  <option value={"title"}>Title only</option>
                  <option value={"titlebody"}>Title + Body</option>
                  <option value={"body"}>Body only</option>
                </select>
                <button className="Button" onClick={handleSearch}>
                  Search
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </body>
    </div>
  );
}

export default App;
