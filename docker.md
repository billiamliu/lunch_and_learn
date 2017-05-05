# Getting Started With Docker & Docker-Compose
### Credit
This tutorial is largely copied from [Digital Ocean's article](https://www.digitalocean.com/community/tutorials/how-to-configure-a-continuous-integration-testing-environment-with-docker-and-docker-compose-on-ubuntu-14-04), based on [Docker's Getting Started Tutorial](https://www.digitalocean.com/community/tutorials/docker-explained-how-to-containerize-python-web-applications)

## Objective

- learn basic `docker`
- use `docker-compose`
- hook up multiple docker compositions (CI)

## Step 1 - Hello World

Let's build a hello world server in python.
Create some files:
```python
# app.py

from flask import Flask

app = Flask(__name__)

visits = 0

@app.route("/")
def hello():
    global visits
    visits += 1
    return 'Hello World! I have been seen {} times.\n'.format(visits)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000)
```
```
# requirements.txt
flask
```
Run it:
```bash
$ pip install -r requirements.txt
$ python app.py
$ curl http://127.0.0.1:3000
Hello World! I have been seen 1 times.
$ curl http://127.0.0.1:3000
Hello World! I have been seen 2 times.
```

_Did you know, `pip` is recursive acronym for `pip installs python`?_


## Step 2 - Dockerise for Fun and Profit

Modify our python server to use `0.0.0.0` rather than the local loopback IP.

Create a build file
```
# Dockerfile

FROM python:2.7-slim
ADD app.py /code/app.py
ADD requirements.txt /code/requirements.txt
# can also use ADD . /code instead of ^
WORKDIR /code
RUN pip install -r requirements.txt
EXPOSE 3000
CMD ["python", "app.py"]
```

Build the image, give it a tag `hihi`, otherwise you'd have to refer to the image ID when running commands.
```bash
$ docker build . -t hihi
```

Run `$ docker images` to see your image (as well as the python image). Run `$ docker rmi hihi` to remove the build if you'd like; or `$ docker rmi <image ID>`.

Run it!
`-p` maps a local port `3210` to the exposed port of `3000`. You can also use `3000:3000`.
```bash
$ docker run -p 3210:3000 hihi
```

## Step 2.pro_tip Run A Container As a Daemon

```bash
$ docker run -p 3210:3000 -d hihi
87e7a68907b6902163d784d779b3a16a8650feed7ac3e926a63408de4cc9930d
$
```

_But wait, how do we stop the container? Where's my `ctrl + c` interrupt?_

Let's see the docker processes currently running:
```bash
$ docker ps

CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                    NAMES
39fa32b8adfa        hihi                "python app.py"     4 minutes ago       Up 4 minutes        0.0.0.0:3210->3000/tcp   frosty_kirch
```

There are at least two ways to do it: by *container ID*, and by *name*.

```bash
$ docker stop 39fa32b8adfa
<or>
$ docker stop frosty_kirch
```

Rather than docker giving you a random name like `frosty_kirch`, we can also assign a name with the `--name` switch when starting our container.

```bash
$ docker run -p 3210:3000 --name yoyo -d hihi
```

Now we can stop our container by referencing `yoyo`.

We can also restart an existing container without having to run an image again:
```bash
$ docker start yoyo
```

## Step 2.clean_up

In case you are curious, _can we delete these build images and containers?_
The answer is _yes_.

First, let's see our shut-down containers:
```bash
$ docker ps -a
```

Then we can remove it by:
```bash
$ docker rm yoyo
```

_Gee, what if I have n containers? Ain't nobody got time for this!_

The switch `-q` lists container IDs, and we can pass it into `rm`:
```bash
$ docker rm $(docker ps -aq)
```

The same applies to images, instead of `rm`, it's just `rmi`.
```bash
$ docker rmi hihi
<or>
$ docker rmi $(docker images -q)
```

## Step 3 Compose All The Things
Assuming our `hello world` isn't a loner, let's give it some dependencies to play with. Global variables are bad; it's only natural to spin up a redis db to keep track of a visitor count!

Let's modify our python code and hook it up to redis.
```python
from flask import Flask
from redis import Redis

app = Flask(__name__)
redis = Redis(host='redis')

@app.route('/')
def hello():
    count = redis.incr('hits')
    return 'Hello World! I have been seen {} times.\n'.format(count)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
```
```
# requirements.txt
flask
redis
```

Since there are so many readily available docker images, we'll skip building a redis container and use a readily made image hosted on Docker, when we compose our containers.... now!

`docker-compose` needs a manifest, touch one:
```yml
# composition.yml
app:
  build: .
  dockerfile: Dockerfile
  links:
    - redis
  ports:
    - "3210:3000"
redis:
  image: redis
```

*Done*

That's it.

In our manifest we declared a redis image, docker-compose will fetch that image and spin in up in a container for us. `links` hooked up the containers so we don't manually have to. Let's try it out.
```bash
$ docker-compose -f composition.yml build
$ docker-compose -f composition.yml up
```

In a new terminal:
```bash
$ curl http://127.0.0.1:3210
Hello World! I have been seen 1 times.
$ curl http://127.0.0.1:3210
Hello World! I have been seen 2 times.
```

## Step 3.pro_tip Shortcuts

Run `docker-compose` as a daemon:
```bash
$ docker-compose -f composition.yml up -d
```

View running compositions:
```bash
$ docker-compose ps
CONTAINER ID        IMAGE               COMMAND                  CREATED              STATUS              PORTS                    NAMES
36af836ad23f        helloworld_app      "python app.py"          About a minute ago   Up About a minute   0.0.0.0:3210->3000/tcp   helloworld_app_1
b52547dde868        redis               "docker-entrypoint..."   About a minute ago   Up About a minute   6379/tcp                 helloworld_redis_1
```

Shut down:
```bash
$ docker-compose -f composition.yml down
```

By convention `docker-compose` looks for a file `docker-compose.yml`, so if we name our `composition.yml` to that, we can run it from the current directory without having to specify the file:
```bash
$ docker-compose build
$ docker-compose up
```

Similar to `docker`'s `--name` for specifying a container name for easy reference, we can specify a compose project name. By default it uses the dirname + container + number (i.e. helloworld_app_1).
```bash
$ docker-compose -p yoyo build
$ docker-compose -p yoyo up
$ docker-compose -p yoyo down
```

## Step 3.pro_tip Useful Commands

While the composition of containers are running, you can interact with them.

Getting the container IP:
```bash
$ docker inspect --format '{{ .Networkettings.IPAddress }}' helloworld_app_1
172.17.0.3
```

See logs:
```bash
$ docker logs helloworld_app_1
```

Start a bash session or run any command:
`-it` is for `interactive` and `tty`
```bash
$ docker exec -it helloworld_app_1 bash
```

## Step 4 Use The Composition From Another Composition

Assuming we are spinning up a project that requires our existing composition, perhaps a test, or a consumer, etc., the projects will need to talk to each other. In `docker-compose` we can specify another project as its external link.

First, let's create a test:
```bash
# test.sh
sleep 5
if curl app:3000 | grep -q 'Hello World'
then
  echo "Tests passed!"
  exit 0
else
  echo "Tests failed!"
  exit 1
fi
```

_If we specify port 80 in our app, we can simply use `app` instead of `app:3000`_

And then build artifacts:
```
# Dockerfile.test
FROM ubuntu:trusty

RUN apt-get update && apt-get install -yq curl && apt-get clean

WORKDIR /app

ADD test.sh /app/test.sh

CMD ["bash", "test.sh"]
```
```
# docker-compose.test.yml
test:
  build: .
  dockerfile: Dockerfile.test
  links:
    - app
app:
  build: .
  dockerfile: Dockerfile
  links:
    - redis
redis:
  image: redis
```

Build & Run
```bash
$ docker-compose -f docker-compose.test.yml -p test build
...
$ docker-compose -f docker-compose.test.yml -p test up -d
```

Did our test pass?
Our test container did an assertion and then exited, to inspect its log:
```bash
$ docker logs ci_test_1
Tests passed!
```

We also specified the script to `exit 0`, so that a CI framework can pick it up as ok.

But the `app` and `redis` containers are still running, let's shut them down.
```bash
$ docker-compose -p ci down
```

## Step 5 Environment Variables

Just for practice, let's see how env vars are passed into the builds. This can be useful for configuring postgres db names, configure ports, etc.

There are at least two ways to do it in our set up - via `Dockerfile` and via `docker-compose.yml`.

Edit `Dockerfile` to include a `APP_PORT`:
```
FROM python:2.7-slim
ADD . /code
WORKDIR /code
RUN pip install -r requirements.txt
ENV APP_PORT 3000
EXPOSE 3000
CMD ["python", "app.py"]
```

Make the following changes to `app.py`:
```python
import os
app.run(host="0.0.0.0", port=int(os.environ['APP_PORT']))
```

Your file should look like
```python
from flask import Flask
from redis import Redis
import os

app = Flask(__name__)
redis = Redis(host='redis')

@app.route('/')
def hello():
    count = redis.incr('hits')
    return 'Hello World! I have been seen {} times.\n'.format(count)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ['APP_PORT']))
```

Modify `docker-compose.test.yml`
```
test:
  build: .
  dockerfile: Dockerfile.test
  environment:
    - TEST_PORT=3000
  links:
    - app
app:
  build: .
  dockerfile: Dockerfile
  links:
    - redis
redis:
  image: redis
```

Then make the change to `test.sh`:
```bash
sleep 5
if curl app:$TEST_PORT | grep -q 'Hello World'
then
  echo "Tests passed!"
  exit 0
else
  echo "Tests failed!"
  exit 1
fi
```

Build an run for fun and profit:
```bash
$ docker-compose -p ci build
...
$ docker-compose -p ci run
```

## Step 6 Delete All The Things
To quickly remove all stopped docker containers:
```bash
$ docker container prune
```

To quickly remove all intermediate `<none>:<none>` images docker built (TL;DR zombie images):
[more references here](http://www.projectatomic.io/blog/2015/07/what-are-docker-none-none-images/)
```bash
$ docker image prune
```

Normally I'd like to keep the base images such as `redis`, `python`, etc. But feeling lazy today, so let's `rm -rf` all the images too.
`-f` for force, `-a` to specify all, not just dangling/zombie ones
```bash
$ docker image prune -af
```
