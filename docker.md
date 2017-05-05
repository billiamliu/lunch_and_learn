# Getting Started With Docker & Docker-Compose
*Credit*
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
    html = "<h3>Hello World!</h3>" \
           "<b>Visits:</b> {visits}" \
           "<br/>"
    return html.format(visits=visits)

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
<h3>Hello World!</h3><b>Visits:</b> 1<br/>
$ curl http://127.0.0.1:3000
<h3>Hello World!</h3><b>Visits:</b> 2<br/>
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
