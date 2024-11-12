import './App.css';
import axios from 'axios';
import React, {useState} from 'react';

function copyURL(event) {
  var buttonId = event.target.id;
  var copyText = document.getElementById(buttonId.slice(0, -6));
  navigator.clipboard.writeText(copyText.href);
}

function App() {
  const [inputText, setInputText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [data, setData] = useState(null);

  // Send input text to backend server and find most relevant articles
  const handleSearch = () => {
    axios.post('http://127.0.0.1:5000/api/data', {"query" : inputText})
      .then(response => setData(response.data.result), setShowResult(true))
      .catch(error => console.error("Error fetching data:", error));
  };

  // Go back to the input page
  const goBack = () => {
    setShowResult(false);
    setData(null);
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>Background Link Finder</p>
      </header>
      <body className="App-body">
        <div>
          {/* Display the search result or the input page */}
          { showResult ? (<>
          {data ? (<>
          {/* Go through returned data list, iterate through each article and then display them */}
          {data.map((article, i) => (
            <p key={i}>Rank {article[0]}: <a id={i} href={article[2]}>{article[1]}</a>
            <button id={i + "Button"} className="URL-button" onClick={(event) => copyURL(event)}>Copy URL</button></p>
          ))}
          <button className="Button" onClick={goBack}>Back</button>
          </>) : (<><p>Loading...</p></>)}
          </>) : (<>
          <p>Enter article contents:</p>
          <textarea name="inputArticle" value={inputText} onChange={(e) => setInputText(e.target.value)} rows={20} cols={100}/>
          <br />
          <button className="Button" onClick={handleSearch}>Search</button>
          </>)}
        </div>
      </body>
    </div>
  );
}

export default App;
