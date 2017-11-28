#
# OS.js - JavaScript Cloud/Web Desktop Platform
#
# Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# Dockerfile maintained by: andersevenrud, jbourdale
# Dockerfile created by: junland
#

FROM node:boron-alpine
MAINTAINER osjs

# Install dependencies
RUN apk add --no-cache git
RUN apk add --no-cache bash
RUN apk add --no-cache python
RUN apk add --no-cache make
RUN apk add --no-cache g++
RUN apk add --no-cache mysql-client
RUN apk add --no-cache --virtual .build-deps 

RUN npm install -g supervisor
RUN npm install sqlite3 mysql
RUN npm install bcrypt --build-from-source

# Clone OS.js
WORKDIR /
RUN mkdir OS.js
ADD . /OS.js/

# Install OS.js
WORKDIR OS.js/
RUN npm install
RUN node osjs build


# Run OS.js
CMD ["bash", "bin/docker_start.sh"]
EXPOSE 8000
