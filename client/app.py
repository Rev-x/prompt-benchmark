import streamlit as st
import aiohttp
import asyncio
import nest_asyncio
import os
from openai import AsyncOpenAI
from conva_ai import AsyncConvaAI  
import time
import json

nest_asyncio.apply()

API_KEY = os.environ.get('OPENAI_API_KEY')
API_BASE_URL = "http://localhost:8000"  # Change this to your deployed API URL

client = AsyncOpenAI(api_key=API_KEY)


import streamlit as st
import aiohttp
import asyncio

API_BASE_URL = "http://localhost:8000"

async def fetch_api(endpoint, method="GET", data=None):
    async with aiohttp.ClientSession() as session:
        try:
            if method == "GET":
                async with session.get(f"{API_BASE_URL}{endpoint}") as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        st.error(f"Error fetching data: HTTP {response.status}")
                        return []
            elif method == "POST":
                async with session.post(f"{API_BASE_URL}{endpoint}", json=data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        st.error(f"Error posting data: HTTP {response.status}")
                        return []
        except aiohttp.ClientError as e:
            st.error(f"Network error: {str(e)}")
            return []

def main():
    st.title("ELO Scoring Platform for LLMs")
    async def fetch_openai_response(prompt, model="gpt-4o-mini-2024-07-18"):
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=512
        )
        return response.choices[0].message.content

    async def fetch_conva_ai_response(assistant_id, assistant_version, api_key, query):
        conva_client = AsyncConvaAI(
            assistant_id=assistant_id,
            assistant_version=assistant_version,
            api_key=api_key
        )
        response = await conva_client.invoke_capability_name(query, stream=False, capability_name=selected_option)
        response = response.model_dump()['parameters']
        response = json.dumps(response, indent=4)
        return response

    async def handle_response(prompt, model_name, assistant_data=None):
        if model_name == 'Conva Assistant':
            assistant_id = assistant_data['assistant_id']
            assistant_version = str(assistant_data['assistant_version'])
            api_key = assistant_data['assistant_apikey']
            response = await fetch_conva_ai_response(assistant_id, assistant_version, api_key, prompt)
        else:
            response = await fetch_openai_response(prompt)
        return response

    async def fetch_responses(user_input):
        prompts = await fetch_api(f"/random_prompts/{selected_option}")

        if prompts[0]['origin'] == 'Conva Assistant':
            assistant_data1 = prompts[0]
            prompt1 = user_input
        else:
            assistant_data1 = None
            prompt1 = prompts[0]['prompt'].replace("{query}", user_input)

        if prompts[1]['origin'] == 'Conva Assistant':
            assistant_data2 = prompts[1]
            prompt2 = user_input
        else:
            assistant_data2 = None
            prompt2 = prompts[1]['prompt'].replace("{query}", user_input)

        response1, response2 = await asyncio.gather(
            handle_response(prompt1, prompts[0]['origin'], assistant_data1),
            handle_response(prompt2, prompts[1]['origin'], assistant_data2)
        )

        st.session_state.prompt1 = prompt1
        st.session_state.prompt2 = prompt2
        st.session_state.llm1_response = response1
        st.session_state.llm2_response = response2
        st.session_state.model1_name = prompts[0]['origin']
        st.session_state.model2_name = prompts[1]['origin']

        st.session_state.show_results = False
        st.rerun()

    options = asyncio.run(fetch_api("/fetch_use_cases"))
    selected_option = st.selectbox("Select Use Case", options)

    col1, col2 = st.columns(2)

    if 'llm1_response' not in st.session_state:
        st.session_state.llm1_response = ""
    if 'llm2_response' not in st.session_state:
        st.session_state.llm2_response = ""
    if 'model1_name' not in st.session_state:
        st.session_state.model1_name = ""
    if 'model2_name' not in st.session_state:
        st.session_state.model2_name = ""
    if 'prompt1' not in st.session_state:
        st.session_state.prompt1 = ""
    if 'prompt2' not in st.session_state:
        st.session_state.prompt2 = ""
    if 'user_input' not in st.session_state:
        st.session_state.user_input = ""
    if 'show_results' not in st.session_state:
        st.session_state.show_results = False
    if 'winner' not in st.session_state:
        st.session_state.winner = ""

    if not st.session_state.show_results:
        user_input = st.text_input("Enter your input here:", "")
        if st.button("Submit"):
            st.session_state.user_input = user_input
            asyncio.run(fetch_responses(user_input))

    with col1:
        st.subheader("Response A")
        st.text_area("Model A", st.session_state.llm1_response, height=300, key="model_a")

    with col2:
        st.subheader("Response B")
        st.text_area("Model B", st.session_state.llm2_response, height=300, key="model_b")

    if st.session_state.llm1_response and st.session_state.llm2_response:
        st.subheader("Rate the responses")
        col4, col5, col6, col7 = st.columns(4)

        if col4.button("👈 Left (A)"):
            st.session_state.show_results = True
            st.session_state.winner = st.session_state.model1_name
            asyncio.run(fetch_api("/update_elo", method="POST", data={
                "model_a": st.session_state.model1_name,
                "model_b": st.session_state.model2_name,
                "result": "win"
            }))
            asyncio.run(fetch_api("/increment_total_games", method="POST"))
            st.rerun()
            
        if col5.button("Right (B) 👉"):
            st.session_state.show_results = True
            st.session_state.winner = st.session_state.model2_name
            asyncio.run(fetch_api("/update_elo", method="POST", data={
                "model_a": st.session_state.model1_name,
                "model_b": st.session_state.model2_name,
                "result": "loss"
            }))
            asyncio.run(fetch_api("/increment_total_games", method="POST"))
            st.rerun()

        if col6.button("Both Good"):
            st.session_state.show_results = True
            st.session_state.winner = "both_good"
            asyncio.run(fetch_api("/update_elo", method="POST", data={
                "model_a": st.session_state.model1_name,
                "model_b": st.session_state.model2_name,
                "result": "both_good"
            }))
            asyncio.run(fetch_api("/increment_total_games", method="POST"))
            st.rerun()
        
        if col7.button("Both Bad"):
            st.session_state.show_results = True
            st.session_state.winner = "both_bad"
            asyncio.run(fetch_api("/update_elo", method="POST", data={
                "model_a": st.session_state.model1_name,
                "model_b": st.session_state.model2_name, 
                "result": "both_bad"
            }))
            asyncio.run(fetch_api("/increment_total_games", method="POST"))
            st.rerun()
    game_no = asyncio.run(fetch_api("/increment_total_games", method="POST"))
    if st.session_state.show_results:
        response_data = {
            'game_no': game_no['game_no'],
            'query': st.session_state.user_input,
            'use_case': selected_option,
            'model_a': st.session_state.model1_name,
            'model_b': st.session_state.model2_name,
            'response_a': st.session_state.llm1_response,
            'response_b': st.session_state.llm2_response,
            'winner_model': st.session_state.winner
        }
        asyncio.run(fetch_api("/add_response", method="POST", data=response_data))
        st.success("Response and rating added successfully!")


        with col1:
            st.write(f"Model A: {st.session_state.model1_name}")

        with col2:
            st.write(f"Model B: {st.session_state.model2_name}")

    if st.button('reset'):
        for key in ['llm1_response', 'llm2_response', 'model1_name', 'model2_name', 'prompt1', 'prompt2', 'user_input', 'show_results', 'winner']:
            st.session_state[key] = ""
        st.rerun()

if __name__ == "__main__":
    main()

    