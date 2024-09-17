import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminPanel = () => {
  const [models, setModels] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState('');
  const [promptText, setPromptText] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newUseCase, setNewUseCase] = useState('');
  const [assistantData, setAssistantData] = useState({
    assistant_id: '',
    assistant_apikey: '',
    assistant_version: '',
    use_case: '',
  });
  const [prompts, setPrompts] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [activeTab, setActiveTab] = useState('AddPrompt');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const modelsResponse = await axios.get(`${API_BASE_URL}/fetch_models`);
        const useCasesResponse = await axios.get(`${API_BASE_URL}/fetch_use_cases`);
        setModels(modelsResponse.data);
        setUseCases(useCasesResponse.data);
      } catch (error) {
        console.error("Error fetching models or use cases:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedModel && selectedUseCase && activeTab === 'ViewPrompts') {
      fetchPrompts();
    }
  }, [selectedModel, selectedUseCase]);

  const handleAddPrompt = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/add_prompt`, {
        origin: selectedModel,
        use_case: selectedUseCase,
        prompt: promptText,
      });
      alert(response.data.message);
    } catch (error) {
      console.error("Error adding prompt:", error);
    }
  };

  const handleAddUseCase = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/add_use_case`, { use_case: newUseCase });
      alert(response.data.message);
    } catch (error) {
      console.error("Error adding use case:", error);
    }
  };

  const handleAddAssistant = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/add_assistant`, assistantData);
      alert(response.data.message);
    } catch (error) {
      console.error("Error adding assistant:", error);
    }
  };

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/view_prompts/${selectedModel}/${selectedUseCase}`);
      setPrompts(response.data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    }
  };

  const fetchAssistants = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/view_assistants`);
      setAssistants(response.data);
    } catch (error) {
      console.error("Error fetching assistants:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'ViewPrompts' && selectedModel && selectedUseCase) {
      fetchPrompts();
    } else if (activeTab === 'ViewAssistants') {
      fetchAssistants();
    }
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'AddPrompt':
        return (
          <div className="mt-4">
            <h2>Add Prompt</h2>
            <div className="form-group">
              <label>Select Model</label>
              <select className="form-control" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Use Case</label>
              <select className="form-control" value={selectedUseCase} onChange={(e) => setSelectedUseCase(e.target.value)}>
                {useCases.map((useCase) => (
                  <option key={useCase} value={useCase}>
                    {useCase}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Prompt Text</label>
              <textarea
                className="form-control"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              ></textarea>
            </div>
            <button className="btn btn-primary mt-3" onClick={handleAddPrompt}>Add Prompt</button>
          </div>
        );
      case 'AddModel':
        return (
          <div className="mt-4">
            <h2>Add New Model</h2>
            <div className="form-group">
              <label>Model Name</label>
              <input
                type="text"
                className="form-control"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Enter New Model Name"
              />
            </div>
            <div className="form-group">
              <label>Select Use Case</label>
              <select className="form-control" value={selectedUseCase} onChange={(e) => setSelectedUseCase(e.target.value)}>
                {useCases.map((useCase) => (
                  <option key={useCase} value={useCase}>
                    {useCase}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Prompt Text</label>
              <textarea
                className="form-control"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              ></textarea>
            </div>
            <button className="btn btn-primary mt-3" onClick={handleAddPrompt}>Add New Model</button>
          </div>
        );
      case 'AddUseCase':
        return (
          <div className="mt-4">
            <h2>Add Use Case</h2>
            <div className="form-group">
              <label>Use Case</label>
              <input
                type="text"
                className="form-control"
                value={newUseCase}
                onChange={(e) => setNewUseCase(e.target.value)}
                placeholder="Enter New Use Case"
              />
            </div>
            <button className="btn btn-primary mt-3" onClick={handleAddUseCase}>Add Use Case</button>
          </div>
        );
      case 'AddAssistant':
        return (
          <div className="mt-4">
            <h2>Add Assistant</h2>
            <div className="form-group">
              <label>Assistant ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Assistant ID"
                value={assistantData.assistant_id}
                onChange={(e) => setAssistantData({ ...assistantData, assistant_id: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>API Key</label>
              <input
                type="text"
                className="form-control"
                placeholder="Assistant API Key"
                value={assistantData.assistant_apikey}
                onChange={(e) =>
                  setAssistantData({ ...assistantData, assistant_apikey: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Assistant Version</label>
              <input
                type="text"
                className="form-control"
                placeholder="Assistant Version"
                value={assistantData.assistant_version}
                onChange={(e) =>
                  setAssistantData({ ...assistantData, assistant_version: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Select Use Case</label>
              <select
                className="form-control"
                value={assistantData.use_case}
                onChange={(e) =>
                  setAssistantData({ ...assistantData, use_case: e.target.value })
                }
              >
                {useCases.map((useCase) => (
                  <option key={useCase} value={useCase}>
                    {useCase}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary mt-3" onClick={handleAddAssistant}>Add Assistant</button>
          </div>
        );
      case 'ViewPrompts':
        return (
          <div className="mt-4">
            <h2>View Prompts</h2>
            <div className="form-group">
              <label>Select Model</label>
              <select className="form-control" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Use Case</label>
              <select className="form-control" value={selectedUseCase} onChange={(e) => setSelectedUseCase(e.target.value)}>
                {useCases.map((useCase) => (
                  <option key={useCase} value={useCase}>
                    {useCase}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary mt-3" onClick={fetchPrompts}>Fetch Prompts</button>
            <table className="table table-bordered mt-3">
              <thead className="thead-dark">
                <tr>
                  <th>Version</th>
                  <th>Prompt</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((prompt, index) => (
                  <tr key={index}>
                    <td>{prompt.version}</td>
                    <td>{prompt.prompt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'ViewAssistants':
        return (
          <div className="mt-4">
            <h2>View Assistants</h2>
            <table className="table table-bordered mt-3">
              <thead className="thead-dark">
                <tr>
                  <th>Assistant ID</th>
                  <th>API Key</th>
                  <th>Version</th>
                  <th>Use Case</th>
                </tr>
              </thead>
              <tbody>
                {assistants.map((assistant, index) => (
                  <tr key={index}>
                    <td>{assistant.assistant_id}</td>
                    <td>{assistant.assistant_apikey}</td>
                    <td>{assistant.assistant_version}</td>
                    <td>{assistant.use_case}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Admin Panel</h1>
      <nav className="nav justify-content-center mb-4">
        <button
          className={`nav-link btn ${activeTab === 'AddPrompt' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('AddPrompt')}
        >
          Add Prompt
        </button>
        <button
          className={`nav-link btn ${activeTab === 'AddModel' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('AddModel')}
        >
          Add New Model
        </button>
        <button
          className={`nav-link btn ${activeTab === 'AddUseCase' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('AddUseCase')}
        >
          Add Use Case
        </button>
        <button
          className={`nav-link btn ${activeTab === 'AddAssistant' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('AddAssistant')}
        >
          Add Assistant
        </button>
        <button
          className={`nav-link btn ${activeTab === 'ViewPrompts' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('ViewPrompts')}
        >
          View Prompts
        </button>
        <button
          className={`nav-link btn ${activeTab === 'ViewAssistants' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('ViewAssistants')}
        >
          View Assistants
        </button>
      </nav>
      <div>{renderTabContent()}</div>
    </div>
  );
};

export default AdminPanel;
