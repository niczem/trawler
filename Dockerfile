FROM alekzonder/puppeteer

# If running Docker >= 1.13.0 use docker run's --init arg to reap zombie processes, otherwise
# uncomment the following lines to have `dumb-init` as PID 1
#ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_x86_64 /usr/local/bin/dumb-init
#RUN chmod +x /usr/local/bin/dumb-init
#ENTRYPOINT ["dumb-init", "--"]

USER root
RUN apt update
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && apt install ./google-chrome-stable_current_amd64.deb -y
#USER pptruser
# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-stable'})
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH="/opt/google/chrome/google-chrome".
# Run everything after as non-privileged user.
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /app/trawler
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY . .

#USER root
#RUN chown pptruser /app/trawler
#USER pptruser
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

RUN apt install zip imagemagick ffmpeg -y
EXPOSE 3000


