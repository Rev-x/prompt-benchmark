#!/bin/sh
python3 start.py &
streamlit run streamlit_app.py --server.port 80 --server.address 0.0.0.0 --server.enableCORS=false --server.enableXsrfProtection=false