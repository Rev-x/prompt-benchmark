FROM --platform=amd64 node:22.5.1
# ARG CONTAINER_TYPE
# ENV container_type=${{CONTAINER_TYPE}}
ENV APP_HOME /app_home
WORKDIR ${APP_HOME}

COPY ./package.json ${APP_HOME}
RUN npm install

COPY client/leaderboard-app/package.json ${APP_HOME}/client/leaderboard-app/package.json
RUN cd ${APP_HOME}/client/leaderboard-app && npm install
RUN npm i bootstrap@5.3.3

ENV REACT_APP_API_BASE_URL="<Website URL of where you hosting> remove the quotes and just paste the url"

COPY . .

EXPOSE 3000
EXPOSE 80

WORKDIR ${APP_HOME}/client/leaderboard-app
ENTRYPOINT ["/bin/bash", "-c"]
CMD ["npm start"]