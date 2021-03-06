<!--THIS FILE IS AUTOGENERATED, TO UPDATE ITS CONTENT, UPDATE THE README.template.md IN THE docs DIR-->
<center>

<h1>Trawler</h1>

<img src="src/assets/icon.svg">

A job scheduler and analysis tool for webscraping (and other) tasks.

</center>

![Node.js Package](https://github.com/niczem/trawler/workflows/Node.js%20Package/badge.svg)

## Datasources
Curently the following datasources are implemented:

INCLUDE_DATASOURCES_STRING


## Features
- simple configuration of actions/datasources, also from 3rd party modules/repos
- job monitoring and scheduling
- schedule jobs
- sqlite, csv and json browser
- separation of datasets/artifacts (one archive per crawl)
- scalable amount of workers (also on other machines)

## Architecture
### Frontend and API
- GUI to create and schedule jobs
- Displays pending, running and done jobs
- Display csv and sqlite datasets

### Worker(s)
- Can be distributed (workers and c&c on different locations/servers)
- Jobs are managed through json files (and can be distrubuted with an adapter like pouchDB)
- Multithreaded


## Install

### Using Docker-Compose

Install using [docker-compose](https://docs.docker.com/compose/install/) by running:

```
docker-compose up
```
