FROM --platform=amd64 python:3.12
# ARG CONTAINER_TYPE
# ENV container_type=${{CONTAINER_TYPE}}
ENV APP_HOME /app_home
WORKDIR ${APP_HOME}

COPY ./requirements.txt ${APP_HOME}/requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

EXPOSE 8080
EXPOSE 80

ENTRYPOINT ["/bin/bash", "-c"]
CMD ["python3 start.py"]