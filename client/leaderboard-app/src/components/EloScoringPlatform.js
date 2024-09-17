import React, { useState, useEffect } from 'react';
import axios from 'axios';
import mixpanel from "mixpanel-browser";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheck } from 'react-icons/fa';
import Footer from './Footer';

mixpanel.init(process.env.REACT_APP_MIXPANEL_TOKEN, {
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
});

const EloScoringPlatform = () => {
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [userInput, setUserInput] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [responses, setResponses] = useState({ responseA: '', responseB: '' });
  const [models, setModels] = useState({ model1: '', model2: '' });
  const [showResults, setShowResults] = useState(false);
  const [voted, setVoted] = useState(false); 
  const [winner, setWinner] = useState('');
  const [gameNumber, setGameNumber] = useState(0);
  const [submitClicked, setSubmitClicked] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const API_BASE_URL =  process.env.REACT_APP_API_BASE_URL;

  const displayNameMapping = {
    'product_search': 'Product Search',
    'travel_search': 'Travel Search',
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (!selectedOption) {
      setErrorMessage('Please select a category.');
      return;
    }
    
    if (!userInput) {
      setErrorMessage('Please enter a query.');
      return;
    }
    mixpanel.track('Submit Button Clicked', { userInput });
    fetchPrompts();
    setSubmitClicked(true);
    setIsInputDisabled(true);
  };

  useEffect(() => {
    let timer;
    if (copiedA) {
      timer = setTimeout(() => setCopiedA(false), 1000);
    }
    return () => clearTimeout(timer);
  }, [copiedA]);

  useEffect(() => {
    let timer;
    if (copiedB) {
      timer = setTimeout(() => setCopiedB(false), 1000);
    }
    return () => clearTimeout(timer);
  }, [copiedB]);

  useEffect(() => {
    const fetchUseCases = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/fetch_use_cases`);
        setOptions(response.data);
        if (response.data.length > 0) setSelectedOption();
      } catch (error) {
        console.error('Error fetching use cases:', error);
      }
    };

    fetchUseCases();
  }, [API_BASE_URL]);

  const fetchPrompts = async () => {
    try {
      setLoading(true); 
      setSubmitClicked(true);
      mixpanel.track('Prompt Submitted', {
        selectedOption,
        userInput,
      });
      const response = await axios.get(`${API_BASE_URL}/random_prompts/${selectedOption}`);
      setPrompts(response.data);
      await fetchResponses(response.data, userInput);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false); 
    }
  };

  const fetchResponses = async (prompts, input) => {
    try {
      const response1 = await handleResponse(prompts[0], input);
      const response2 = await handleResponse(prompts[1], input);
      setResponses({ responseA: response1, responseB: response2 });
      setModels({ model1: prompts[0].origin, model2: prompts[1].origin });
      setShowResults(true); 
      setVoted(false); 
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const handleResponse = async (prompt, userInput) => {
    if (prompt.origin === 'Conva Assistant') {
      return await fetchConvaAIResponse(prompt.assistant_id, prompt.assistant_version, prompt.assistant_apikey, userInput);
    } else {
      return await fetchOpenAIResponse(prompt.prompt.replace('{query}', userInput));
    }
  };

  const fetchOpenAIResponse = async (prompt, model = 'gpt-4o-mini-2024-07-18') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/openai_response`, {
        model: model,
        prompt: prompt,
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching OpenAI response:', error);
      return `Error fetching OpenAI response: ${error.message}`;
    }
  };

  const fetchConvaAIResponse = async (assistantId, assistantVersion, apiKey, query) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/conva_response`, {
        assistant_id: assistantId,
        assistant_version: assistantVersion,
        api_key: apiKey,
        prompt: query,
        use_case: selectedOption
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching Conva AI response:', error);
      return `Error fetching Conva AI response: ${error.message}`;
    }
  };

  const handleOptionChange = (e) => {
    const newOption = e.target.value;
    setSelectedOption(newOption);
    mixpanel.track('Dropdown Option Selected', {
      selectedOption: newOption,
    });
  };

  const handleVote = async (modelName, result) => {
    try {
      let finalWinner = ''; 
  
      if (result === 'win') {
        finalWinner = modelName;
      } else if (result === 'both_good') {
        finalWinner = 'Both Good';
      } else if (result === 'both_bad') {
        finalWinner = 'Both Bad';
      }
  
      setWinner(finalWinner); 
      setVoted(true);
  
      mixpanel.track('Model Voted', {
        gameNumber,
        votedFor: modelName,
        result,
        model1: models.model1,
        model2: models.model2,
        responseA: responses.responseA,
        responseB: responses.responseB,
        userInput: userInput,
        model1Votes: modelName === models.model1 && result === 'win' ? 1 : 0,
        model2Votes: modelName === models.model2 && result === 'win' ? 1 : 0,
        bothGoodVotes: result === 'both_good' ? 1 : 0,
        bothBadVotes: result === 'both_bad' ? 1 : 0,
      });
  
      await axios.post(`${API_BASE_URL}/update_elo`, {
        model_a: models.model1,
        model_b: models.model2,
        result: result,
      });
  
      await fetchGameNumber();
  
      setTimeout(async () => {
        await handleAddResponse(finalWinner); 
        resetSession();
      }, 1000);
    } catch (error) {
      console.error('Error updating ELO:', error);
    }
  };
  
  
  
  const fetchGameNumber = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/total_games`);
      setGameNumber(response.data);
    } catch (error) {
      console.error('Error fetching total games:', error);
    }
  };

  const handleAddResponse = async (finalWinner) => {
    try {
      await axios.post(`${API_BASE_URL}/add_response`, {
        game_no: gameNumber + 1,
        query: userInput,
        use_case: selectedOption,
        model_a: models.model1,
        model_b: models.model2,
        response_a: responses.responseA,
        response_b: responses.responseB,
        winner_model: finalWinner, 
      });
    } catch (error) {
      console.error('Error adding response:', error);
    }
  };  

  const resetSession = () => {
    setUserInput('');
    setResponses({ responseA: '', responseB: '' });
    setModels({ model1: '', model2: '' });
    setShowResults(false);
    setVoted(false);
    setWinner('');
    setSubmitClicked(false);
    setSelectedOption('');
    setIsInputDisabled(false); 
  };
  
  

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#2c2f33', color: '#ffffff', height: '150vh', width:"100%"}}>
    <div className="text-center mb-4">
      <div style={{ backgroundColor: '#6c757d', padding: '5px', borderRadius: '8px' }}>
      <section id="about" style={{ textAlign: 'left', padding: '20px' }}>
      <h2 style={{ textAlign: 'left', color:"#2c2f33" }}>About</h2>
      <p>Inspired by LMSYS, this benchmarking tool enables you to compare the performance of prompts generated by a variety of frameworks. We support Claude, DSPy, Conva-AI, and human prompts, spanning two key categories: Product Search and Travel Search.
      This tool is designed to help you make informed decisions by comparing advanced AI frameworks in a practical and user-friendly environment.
      </p>
        <h2 style={{ textAlign: 'left', color:"#2c2f33" }}>How to Use</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li>
            <strong>Choose a Category:</strong> Select between Product Search or Travel Search.
          </li>
          <li>
            <strong>Enter a Query:</strong> Type a query related to your chosen category.
          </li>
          <li>
            <strong>Compare Responses:</strong> Two responses will be generated. Vote for the one 
            you think is best.
          </li>
          <li>
            <strong>See the Results:</strong> After voting, the names of the models will be revealed, 
            and the leaderboard will update accordingly.
          </li>
        </ol>
      </section>
      </div>
      <br/>
    </div>

    <div className="row mb-4">
      <div className="col text-center">
        <div className="d-flex justify-content-center align-items-center">
          <div className="me-2">
            <select
              autoFocus
              required
              className="form-select form-select-lg bg-light text-black"
              value={selectedOption}
              onChange={handleOptionChange}
              style={{ maxWidth: '200px' }}
            >
              <option value="" disabled>Pick a category</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {displayNameMapping[option] || option}
                </option>
              ))}
            </select>
          </div>
          <div className="me-2" style={{ maxWidth: '800px', flex: '1' }}>
            <input
              placeholder="Enter your query"
              type="text"
              className="form-control form-control-lg bg-light text-black"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isInputDisabled}
              style={{ maxWidth: '800px' }}
            />
          </div>
          <div>
            {!submitClicked && (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
              >
                Submit
              </button>
            )}
            {loading && (
              <div className="text-center">
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {errorMessage && (
          <div className="alert alert-danger mt-3">
            {errorMessage}
          </div>
        )}
      </div>
    </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Framework A</h5>
                <CopyToClipboard text={responses.responseA} onCopy={() => setCopiedA(true)}>
                  <button className="btn btn-outline-light ms-2">
                    {copiedA ? <FaCheck style={{ color: 'green' }} /> : <FaCopy />}
                  </button>
                </CopyToClipboard>
            </div>
            <br/>
              <textarea
                className="form-control bg-secondary text-white"
                value={responses.responseA}
                readOnly
                rows="15"
                style={{ resize: 'none' }}
              />
              {voted && <p className="mt-2">Framework Used: {models.model1}</p>}
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Framework B</h5>
              <CopyToClipboard text={responses.responseB} onCopy={() => setCopiedB(true)}>
                  <button className="btn btn-outline-light ms-2">
                    {copiedB ? <FaCheck style={{ color: 'green' }} /> : <FaCopy />}
                  </button>
                </CopyToClipboard>
            </div>
            <br/>              
            <textarea
                className="form-control bg-secondary text-white"
                value={responses.responseB}
                readOnly
                rows="15"
                style={{ resize: 'none' }}
              />
              {voted && <p className="mt-2">Framework Used: {models.model2}</p>}
            </div>
          </div>
        </div>
      </div>


      {showResults && (
        <div className="row">
          <div className="col text-center">
            <div className="btn-group" role="group" aria-label="Vote options">
              <button
                className="btn btn-outline-success btn-lg"
                onClick={() => handleVote(models.model1, 'win')}
                disabled={voted}
              >
                👈 Left
              </button>
              <button
                className="btn btn-outline-warning btn-lg"
                onClick={() => handleVote('both_good', 'both_good')}
                disabled={voted} 
              >
                Both Good
              </button>
              <button
                className="btn btn-outline-danger btn-lg"
                onClick={() => handleVote('both_bad', 'both_bad')}
                disabled={voted} 
              >
                Both Bad
              </button>
              <button
                className="btn btn-outline-success btn-lg"
                onClick={() => handleVote(models.model2, 'win')}
                disabled={voted} 
              >
                Right 👉
              </button>
            </div>
          </div>
        </div>
      )}
   <Footer />
    </div>
  );
};

export default EloScoringPlatform;
