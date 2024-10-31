import './App.css';
import React, {useState} from 'react';

function App() {
  const [inputText, setInputText] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleSearch = () => {
    setShowResult(true);
  };

  const goBack = () => {
    setShowResult(false);
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>Background Link Finder</p>
      </header>
      <body className="App-body">
        <div>
          { showResult ? (<>
          <p>{inputText}</p>
          <button className="Button" onClick={goBack}>Back</button>
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
