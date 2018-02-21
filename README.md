# magazine app

## development

### conventions

- git branching and workflow: follow [the feature branch workflow](http://nvie.com/posts/a-successful-git-branching-model/)
```
  - master (release branch)
  - develop (integration and test, is available on [heroku](http://too-much-snow-1228.herokuapp.com/))
  - feat-<issueNumber>-<featureName>
    - feat-<issueNumber>-<featureName>-<developerName>
  - fix-<issueNumber>-<issueName>
    - fix-<issueNumber>-<issueName>-<developerName>
```
- use GitHub's features to facilitate communication: follow [github's internal use of github](http://zachholman.com/talk/how-github-uses-github-to-build-github/)
  - use [milestones](https://github.com/falcondai/magazine-app/milestones) to plan
  - use [issues](https://github.com/falcondai/magazine-app/issues) to discuss todos/bugs/ideas
  - open a [PR](https://github.com/falcondai/magazine-app/pulls) early to discuss an ongoing new feature
- code style and conventions: follow [AirBnB's style guide]( https://github.com/airbnb/javascript)

### dependencies

- node, npm
- (for staging) postgreSQL (on Mac, `brew install postgresql`)

### local
```bash
# install dependencies (bower's automatically in postinstall)
npm install

# for frontend dev, start grunt and server
grunt start
npm start

# for backend dev, start server with supervisor
npm run backend-dev

# to generate angular SDK from loopback
# start local server with documentation with lb-ng-doc
lb-ng-doc client/js/services/lb-services.js
# start local server with documentation with grunt
grunt angular-sdk
```

### staging
```bash
# init and start postgreSQL
pg_ctl -D dev-db init
pg_ctl -D dev-db start

# alternatively with a temporary data folder that will
# not persist over OS restarts, replace `./dev-db`
# with `/tmp/dev-db` (this creates a temporary folder)

# create user water
psql postgres -c 'create user water with superuser'
# create database development
psql postgres -U water -c 'create database development'

# install dependencies
npm install
# start app server
NODE_ENV=staging DEBUG=loopback:connector:* node .

# to shutdown postgres
# pg_ctl -D dev-db stop
```

## authors
Falcon Dai <me@falcondai.com>, Anja Ishmukhametova <miukki@gmail.com>
# nodejs-api-magazine-app
