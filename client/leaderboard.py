import streamlit as st
import pandas as pd
import aiohttp
import asyncio

API_BASE_URL = "http://localhost:8000"  # Change this to your deployed API URL


async def fetch_api(endpoint, method="GET", data=None):
    async with aiohttp.ClientSession() as session:
        if method == "GET":
            async with session.get(f"{API_BASE_URL}{endpoint}") as response:
                return await response.json()
        elif method == "POST":
            async with session.post(f"{API_BASE_URL}{endpoint}", json=data) as response:
                return await response.json()
            

def main():
    st.title("ELO Scoring Leaderboard")

    use_cases = asyncio.run(fetch_api("/fetch_use_cases"))
    selected_use_case = st.selectbox("Select Use Case", use_cases)

    if selected_use_case:
        leaderboard_data = asyncio.run(fetch_api(f"/leaderboard/{selected_use_case}"))
        
        if leaderboard_data:
            df = pd.DataFrame(leaderboard_data)
            df = df.sort_values(by='score', ascending=False).reset_index(drop=True)
            df.index += 1
            
            st.table(df)
        else:
            st.write("No data available for the selected use case.")

    # Display total number of games played
    total_games = asyncio.run(fetch_api("/total_games"))
    st.write(f"Total games played: {total_games}")

    # Option to download leaderboard as CSV
    if st.button("Download Leaderboard as CSV"):
        csv = df.to_csv(index=False)
        st.download_button(
            label="Click here to download",
            data=csv,
            file_name=f"leaderboard_{selected_use_case}.csv",
            mime="text/csv",
        )

if __name__ == "__main__":
    main()