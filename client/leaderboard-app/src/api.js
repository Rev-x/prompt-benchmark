// src/api.js

import axios from 'axios';

const API_BASE_URL = "http://0.0.0.0:8080";

export const fetchModels = async () => {
  const response = await axios.get(`${API_BASE_URL}/fetch_models`);
  return response.data;
};

export const fetchUseCases = async () => {
  const response = await axios.get(`${API_BASE_URL}/fetch_use_cases`);
  return response.data;
};

export const addPrompt = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/add_prompts`, data);
  return response.data;
};

export const addUseCase = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/add_use_case`, data);
  return response.data;
};

export const addAssistant = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/add_assistant`, data);
  return response.data;
};

export const fetchPrompts = async (model, useCase) => {
  const response = await axios.get(`${API_BASE_URL}/view_prompts/${model}/${useCase}`);
  return response.data;
};

export const fetchAssistants = async () => {
  const response = await axios.get(`${API_BASE_URL}/view_assistants`);
  return response.data;
};

export const fetchLeaderboard = async (useCase) => {
  const response = await axios.get(`${API_BASE_URL}/leaderboard/${useCase}`);
  return response.data;
};

export const fetchTotalGames = async () => {
  const response = await axios.get(`${API_BASE_URL}/total_games`);
  return response.data;
};

export const updateElo = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/update_elo`, data);
  return response.data;
};

export const addResponse = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/add_response`, data);
  return response.data;
};
