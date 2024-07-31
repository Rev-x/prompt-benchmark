import streamlit as st
import pandas as pd
import aiohttp
import asyncio
import time

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
    st.title("Admin Panel")

    tabs = st.tabs(["Add Prompt", "Add New Model", "View Prompts", "Manage Use Cases", "Add Assistant", "View Assistants"])

    with tabs[0]:
        with st.form("Add Prompt Form", clear_on_submit=True):
            models = asyncio.run(fetch_api("/fetch_models"))
            selected_model = st.selectbox("Select Model", models, key="model_select")

            use_cases = asyncio.run(fetch_api("/fetch_use_cases"))
            selected_use_case = st.selectbox("Select Use Case", use_cases, key="use_case_select")
            use_case = selected_use_case

            prompt_text = st.text_area("Prompt", key="prompt_text_area")

            if st.form_submit_button("Add Prompt"):
                if selected_model and use_case:
                    asyncio.run(fetch_api("/add_prompt", method="POST", data={
                        "origin": selected_model,
                        "use_case": use_case,
                        "prompt": prompt_text
                    }))
                    st.success("Prompt added successfully with versioning!")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.error("Please select a valid model and use case.")

    with tabs[1]:
        with st.form("Add New Model Form",clear_on_submit=True):
            new_model = st.text_input("Enter New Model Name", key="new_model_input")

            use_cases = asyncio.run(fetch_api("/fetch_use_cases"))
            selected_use_case = st.selectbox("Select Use Case", use_cases, key="new_model_use_case_select")

            prompt_text = st.text_area("Prompt", key="new_model_prompt_text_area")

            if st.form_submit_button("Add New Model"):
                if new_model and selected_use_case:
                    asyncio.run(fetch_api("/add_prompt", method="POST", data={
                        "origin": new_model,
                        "use_case": selected_use_case,
                        "prompt": prompt_text
                    }))
                    st.success("New model and prompt added successfully with versioning!")
                    st.rerun()
                else:
                    st.error("Please enter a valid model name and select a use case.")

    with tabs[2]:
        models = asyncio.run(fetch_api("/fetch_models"))
        use_cases = asyncio.run(fetch_api("/fetch_use_cases"))
        selected_model = st.selectbox("Select Model to View Prompts", models, key="model_view")
        selected_use_case = st.selectbox("Select Use Case", use_cases, key="use_case_view")

        if selected_model and selected_use_case:
            prompts = asyncio.run(fetch_api(f"/view_prompts/{selected_model}/{selected_use_case}"))
            if prompts:
                df = pd.DataFrame(prompts)[['version', 'prompt']].set_index('version')
                st.dataframe(df, width=1200)
            else:
                st.write("No prompts found for the selected model and use case.")

    with tabs[3]:
        with st.form("Add Use Case Form",clear_on_submit=True):
            new_use_case = st.text_input("Enter New Use Case", key="new_use_case_input")

            if st.form_submit_button("Add Use Case"):
                if new_use_case:
                    asyncio.run(fetch_api("/add_use_case", method="POST", data={"use_case": new_use_case}))
                    st.success("New use case added successfully!")
                    st.rerun()
                else:
                    st.error("Please enter a valid use case.")

        use_cases = asyncio.run(fetch_api("/fetch_use_cases"))
        if use_cases:
            st.write("Existing Use Cases:")
            df = pd.DataFrame({'Use Case': use_cases})
            st.dataframe(df, width=1200)
        else:
            st.write("No use cases found.")

    with tabs[4]:
        with st.form("Add Assistant Form", clear_on_submit=True):
            assistant_id = st.text_input("Assistant ID", key="assistant_id")
            assistant_apikey = st.text_input("Assistant API Key", key="assistant_apikey")
            assistant_version = st.text_input("Assistant Version", key="assistant_version")
            use_cases = asyncio.run(fetch_api("/fetch_use_cases"))
            selected_use_case = st.selectbox("Select Use Case", use_cases, key="assistant_use_case")
            
            if st.form_submit_button("Add Assistant"):
                if assistant_id and assistant_apikey and assistant_version and selected_use_case:
                    asyncio.run(fetch_api("/add_assistant", method="POST", data={
                        "assistant_id": assistant_id,
                        "assistant_apikey": assistant_apikey,
                        "assistant_version": assistant_version,
                        "use_case": selected_use_case
                    }))
                    st.success("Assistant information added successfully!")
                    st.rerun()
                else:
                    st.error("Please fill all fields.")

    with tabs[5]:
        assistants = asyncio.run(fetch_api("/view_assistants"))
        if assistants:
            df = pd.DataFrame(assistants).set_index('assistant_id')
            st.dataframe(df, width=1200)
        else:
            st.write("No assistants found.")
    
if __name__ ==  "__main__":
    main()