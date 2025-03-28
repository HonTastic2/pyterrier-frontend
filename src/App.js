import "./App.css";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import Quill from "quill";
import "quill/dist/quill.snow.css";

document.body.style = 'background: #4f707f;';


function copyURL(event) {
  var button = event.target;
  var buttonId = event.target.id;
  var copyText = document.getElementById(buttonId.slice(0, -6));
  navigator.clipboard.writeText(copyText.href).then(() => {
    button.textContent = "Copied!";

    document.querySelectorAll(".URL-button").forEach((btn) => {
      if (btn !== button) {
        btn.textContent = "Copy";
      }
    });

    setTimeout(() => {
      button.textContent = "Copy";
    }, 2000);
  });
}

// Get user highlighted text to add a link to
// function getSelectionText() {
//   let text = "";

//   if (window.getSelection) {
//     text = window.getSelection().toString();
//   } else if (document.selection && document.selection.type !== "Control") {
//     text = document.selection.createRange().text;
//   }

//   return text;
// }

function App() {
  const [inputText, setInputText] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [method, setMethod] = useState("title");
  const [showResult, setShowResult] = useState(false);
  const [numResults, setNumResults] = useState(5);
  const [data, setData] = useState(null);
  // const [selectedText, setSelectedText] = useState("");
  const [showError, setShowError] = useState(false);
  const [summary, setSummary] = useState(null);
  // const [editorReady, setEditorReady] = useState(false);
  // const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);

  const handleTabSelect = (i) => {
    setActiveTab(i);
  };

  // const handleSelection = () => {
  //   const text = getSelectionText();
  //   setSelectedText(text);
  // };

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
      .then((response) => { setData(response.data.result); if (response.data.summary) { setSummary(response.data.summary) }; console.log(response.data); })
      .catch((error) => { console.error("Error fetching data:", error); setShowResult(true); setActiveTab(0); setShowError(true) });

    // setEditorReady(true);
  };

  // Go back to the input page
  const goBack = () => {
    setShowResult(false);
    setData(null);
    setActiveTab(null);
    setShowError(false);
    setSummary(null);
    // setQuillInitialized(false);
    // setEditorReady(false);
    if (quillRef.current) {
      quillRef.current = null;
    }
  };

  useEffect(() => {
    const initializeQuill = () => {
      const editorElement = document.getElementById("editor");
      console.log(editorElement)
      if (editorElement && !quillRef.current) {
        quillRef.current = new Quill(editorElement, {
          modules: { toolbar: false },
          theme: "snow",
        });
        quillRef.current.setText(inputText); // Initialize with text
        // setQuillInitialized(true);
      }
    };
  
    if (showResult) {
      setTimeout(initializeQuill, 200); // Delay initialization to ensure DOM is updated
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
        // setQuillInitialized(false);
      }
    };
  }, [activeTab, showResult, inputText]);



  // Handle making the selected text a link
  const linkSelectedText = (event) => {
    const quill = quillRef.current;
    const range = quill.getSelection();
    var button = event.target;
    var buttonId = event.target.id;
    var copyText = document.getElementById(buttonId.slice(0, -6));
    if (range && range.length > 0) {
      quill.formatText(range.index, range.length, "link", copyText.href);
      button.textContent = "Linked!";

      document.querySelectorAll(".Link-button").forEach((btn) => {
        if (btn !== button) {
          btn.textContent = "Link";
        }
      });

      setTimeout(() => {
        button.textContent = "Link";
      }, 2000);

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

  const copyText = () => {
    const quill = quillRef.current;
    const html = quill.root.innerHTML;
  
    // Create a temporary element to store the HTML
    const tempElem = document.createElement("div");
    tempElem.innerHTML = html;
    document.body.appendChild(tempElem);
  
    // Use the Selection API to copy as rich text
    const range = document.createRange();
    range.selectNodeContents(tempElem);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  
    document.body.removeChild(tempElem);
    selection.removeAllRanges();
  
    const button = document.getElementById("copyArticleButton");
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy Article";
    }, 2000);
  };

  const downloadRTF = () => {
    const quill = quillRef.current;
    const html = quill.root.innerHTML;
    const rtfContent = htmlToRtf(html);
  
    // Create a Blob and download as .rtf file
    const blob = new Blob([rtfContent], { type: "application/rtf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "article.rtf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const htmlToRtf = (html) => {
    return (
      "{\\rtf1\\ansi\\deff0 " +
      html
        .replace(/<b>(.*?)<\/b>/g, "{\\b $1}") // Bold
        .replace(/<i>(.*?)<\/i>/g, "{\\i $1}") // Italics
        .replace(/<u>(.*?)<\/u>/g, "{\\ul $1}") // Underline
        .replace(/<a href="(.*?)">(.*?)<\/a>/g, "{\\field{\\*\\fldinst HYPERLINK \"$1\"}{\\fldrslt $2}}") // Preserve links
        .replace(/<br\s*\/?>/g, "\\line ") // New lines
        .replace(/<\/?[^>]+(>|$)/g, "") + // Remove other HTML tags
      "}"
    );
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

  const textOrSummary = (article) => {
    if (summary) {return summary;}
    else {return "If you choose to summarise your article, the terms will appear here.";}
  }

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
                  <p style={{ color: "#ffffff" }}>Error getting links!</p>
                  <p style={{ color: "#ffffff" }}>Please click back to try again:</p>
                  <button className="Button" onClick={goBack}>Back</button>
                </>
              ) : (
                <>
                  {data ? (
                    <>
                      <br />
                      <Tabs onSelect={(i) => handleTabSelect(i)} forceRenderTabPanel>
                        <TabList>
                          <Tab id="tab0">Terms Summarised</Tab>
                          <Tab id="tab1">Link Articles</Tab>
                        </TabList>

                        <TabPanel>
                          <p style={{ color: "#ffffff" }}>Your article has been summarised to:</p>
                          <p style={{ color: "#ffffff" }}>{textOrSummary(inputText)}</p>
                          {/* <p style={{ color: "#ffffff" }}>Selected text: {selectedText}</p> */}
                          <button className="Button" onClick={goBack}>Back</button>
                        </TabPanel>

                        <TabPanel>
                          <div style={{ display: "grid", alignItems: "center", columnGap: 10, paddingLeft: "10%" }}>
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
                                  className="URL-button"
                                  onClick={(event) => copyURL(event)}>
                                  Copy
                                </button>

                                <button
                                  id={i + "Button"}
                                  className="Link-button"
                                  onClick={(event) => linkSelectedText(event)}>
                                  Link
                                </button>

                                <a id={i} href={article[2]} style={{ color: "#44a9d8", alignItems: "left" }}>
                                  {article[1]}
                                </a>


                              </div>))}
                          </div>

                          <button className="Button" id="copyArticleButton" onClick={copyText}>Copy Article</button>
                          <button className="Button" onClick={downloadRTF}>Download Article</button>
                          <button className="Button" onClick={resetSelectedLink}>Remove Selected Link</button>
                          <button className="Button" onClick={resetLinks}>Remove All Links</button>
                          <button className="Button" onClick={goBack}>Back</button>
                          <div
                            key={showResult ? "editor-active" : "editor-inactive"}
                            id="editor"
                            style={{
                              minHeight: "100px",
                              width: "80%",
                              margin: "auto",
                              marginBottom: "20px",
                              border: "1px solid #ccc",
                              borderRadius: "5px",
                              backgroundColor: "#d9d9d9",
                            }}
                          ></div>
                        </TabPanel>


                      </Tabs>
                    </>
                  ) : (
                    <p style={{ color: "#ffffff" }}>Loading...</p>
                  )}
                </>
              )}
            </>
          ) : (
            <><div className="Input-fields">

              <span style={{ justifySelf: "right", color: "#ffffff" }}>Enter article title: &nbsp;</span>
              <textarea
                name="inputTitle"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                rows={2}
                cols={100}
                style={{ borderRadius: "5px", justifySelf: "left", backgroundColor: "#d9d9d9" }}
              />

              <span style={{ justifySelf: "right", color: "#ffffff" }}>Enter article contents: &nbsp;</span>
              <textarea
                name="inputArticle"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={20}
                cols={100}
                style={{ borderRadius: "5px", justifySelf: "left", backgroundColor: "#d9d9d9" }}
              />
              {/* </div> */}
            </div>
              <div>
                <span style={{ color: "#ffffff" }}>Number of results:{" "}</span>
                <select
                  value={numResults}
                  style={{ borderRadius: "5px" }}
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
                <span style={{ color: "#ffffff" }}>&nbsp;Search method:&nbsp;</span>
                <select
                  value={method}
                  style={{ borderRadius: "5px" }}
                  onChange={(e) => setMethod(e.target.value)}>
                  <option value={"title"}>Title only</option>
                  <option value={"titlebody"}>Title + Body</option>
                  <option value={"body"}>Body only</option>
                  <option value={"llm"}>LLM Summarisation</option>
                  <option value={"mct"}>Most Common Terms</option>
                </select>
                <button className="Button" onClick={handleSearch}>
                  Search
                </button>
              </div>
            </>
          )}
        </div>
      </body>
    </div>
  );
}

export default App;
