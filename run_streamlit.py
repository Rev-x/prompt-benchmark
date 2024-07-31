import streamlit.web.cli as stcli
import sys

def run_streamlit():
    sys.argv = ["streamlit", "run", "streamlit_app.py"]
    sys.exit(stcli.main())

if __name__ == "__main__":
    run_streamlit()