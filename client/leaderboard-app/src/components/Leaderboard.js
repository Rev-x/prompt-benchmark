import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './Leaderboard.css'; 
import mixpanel from "mixpanel-browser";
import Footer from './Footer';

const API_BASE_URL =  process.env.REACT_APP_API_BASE_URL;
mixpanel.init(process.env.REACT_APP_MIXPANEL_TOKEN, {
  disable_all_events: false,
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
});

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/leaderboard/all`);
        setLeaderboard(response.data);
        const sortedData = response.data.sort((a, b) => b.score - a.score);
        setLeaderboard(sortedData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">ELO Scoring Leaderboard</h1>
      <h1 className="text-center mb-4">Leaderboard</h1>
      <div className="table-responsive">
        <table className="table table-dark table-striped table-hover table-bordered align-middle rounded-table">
          <thead>
            <tr>
              <th scope="col">Rank</th> 
              <th scope="col">Model Name</th>
              <th scope="col">Score</th>
              <th scope="col">Number of Games</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={index}>
                <td>{index + 1}</td> 
                <td>{entry.model_name}</td>
                <td>{entry.score}</td>
                <td>{entry.no_of_games}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
};
export default Leaderboard;