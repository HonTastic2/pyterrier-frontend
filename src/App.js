import './App.css';
import axios from 'axios';
import React, {useState} from 'react';

function App() {
  const [inputText, setInputText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [data, setData] = useState(null);

  const handleSearch = () => {
    axios.post('http://127.0.0.1:5000/api/data', {"query" : inputText})
      .then(response => setData(response.data.result), setShowResult(true))
      .catch(error => console.error("Error fetching data:", error));
  };

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
          { showResult ? (<>
          {data ? (<>
          <p>{data}</p>
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
