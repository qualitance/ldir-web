# Let's Do It, Romania! #

### Install steps

1. Install NodeJS v0.10
2. Install Docker and Docker compose
3. Modify your vhost so ldir.ro and api.ldir.ro point to 127.0.0.1
4. Configs are loaded based on env. The env is controlled by NODE_ENV in
[docker-compose.yaml](docker-compose.yaml)
5. Server configs can be found in [environment](server/config/environment/)
6. Default values are set [server/config/environment/index.js](server/config/environment/index.js)
The others just overwrite based on NODE_ENV
7. [docker-compose.yaml](docker-compose.yaml) clones as close as possible the structure that we deploy in production
8. [docker-stack.yaml](docker-stack.yaml) controls the deployment infrastructure to the cloud
9. run in the root `docker-compose up` . To detach run with the flag `-d`
10. To stop the infrastructure run `docker-compose down`

## User Manual

[Here](https://docs.google.com/document/d/1JalrzTIXh64KuRByPnxv362upNtSUxgByR20kovoHEM/edit?usp=sharing) you can find the user manual.



## Notes
1. Remote error reporting is handle trough [sentry.io](https://sentry.io)
2. If you have problems with node/kue services not connecting to the local machine
when runing rm -rf ~/ldir-volumes/
3. [Dockerfile-node.yaml](Dockerfile-node.yaml)  handles the kue/api services container definition
4. [Dockerfile-static.yaml](Dockerfile-static.yaml)  handles the static web app container definition
5. To seed the db run `docker-compose exec node /bin/bash -l -c 'node server/seed.js'`
6. To initialize the elastic search index run `docker-compose exec node /bin/bash -l -c 'node server/elasticReset.js'`
7. To login in one of the containers run `docker-compose exec <<servicename>> /bin/bash` . Now you will be in the containers cli

## Docker cloud notes

#### Main labels
node - this is for the cluster and machines that will run our api
kue,redis - this is for the cluster and machines that will run queue service composed of kue and redis db

mongo- runs our mongo cluster and replica sets
Here we have also the following set manually to each machine
mongo1 - runs the main primary mongo
mongo2, mongo2- run the secondary machine


el - elastic search label
lb - load balancer
webspa - our web single page application

the only front facing service should be our load balancer. We leverage vhosts to  lb our requests

#### Recommendations
lb and webspa can run on the same machine without issues
mongo1 should have a dedicated machine and is for the time being our most vulnerable point during a high traffic period
mongo2, mongo3 can run on the same machine
due, redis should run in a separated cluster



## System layout

![System layout in docker cloud and service representation](LDIR_AO-ASIS.png)

NOTE: in ubuntu pls check language to properly compile sass files:

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

TODO: update api docs
# API documentation 


The GET routes generally use query params (ex: uri?param=x), but some of them can use route params (ex: uri/:param).

In places where the query params are used, the params can be sent in any order and some of them are optional. The default values for the optional params will always be the ones in the table below, in the route column.

In places where the route params are used, the params must be sent in the specified order, they are all mandatory and they do not have a default value

In places where the body params are used, the body must be sent as json with the keys being those params.

The mandatory params are marked red and they never have a default value.

Some of the routes support pagination, as marked in the table below. For these routes, you can send two additional query params: page and limit. By default, page=0&limit=10

API authentication is done via a token placed in the Authorization header. The user and its role are decoded from this token. The role allowed access is described in the Restriction column below

API actions can determine a lot of stuff to happen in the background, which is not visible in the response, but trust me, it happens. These are described in the Hooks column.

Route | Method | Restriction | Params | Pagination | Response | Hooks
--- | --- | --- | --- |--- | --- | ---
/api/activities | GET | authenticated | - | yes | returns an array of all the activities of the authenticated user |
/api/activities/viewed | POST | authenticated | query:<br>- <span style="color:red">id</span> is the activity unique _id | no | mark the activity with the specified id as viewed by the authenticated user |
/api/authorities | GET | supervisor | query:<br>- id is the id of the authority<br>- city is the city id of the autority | no | If id is specified, returns a single authority with that id. If city is specified, returns all the authorities in that city. If both are specified, it ignores the city. If none is specified, returns all the authorities in the same county as the user making the query |
/api/cities | GET | anyone | - | no | Returns an array with all the cities |
/api/cities/:id | GET | anyone | id is the id of a city | no | Returns the city with the specified id |
/api/comments | GET | authenticated | query:<br>- <span style="color:red">pile</span> is the pile id | no | Returns an array of all the comments for the pile with the specified id |
/api/comments | POST | authenticated | query:<br>- <span style="color:red">pile</span> is the pile id<br>body:<br>- images is an array of image ids<br>- pile is the pile id<br>- description is the comment | no | Adds a comment to the pile with the specified id. The owner of the comment is the user making the query | The owner of the pile is notified about the comment
/api/contact | POST | anyone | body: first_name, last_name, email, message | no | 200 | An email is sent to the mail specified in app config, from the user specified in the request body
/api/counties | GET | anyone | - | no | returns all the counties sorted by name | 
/api/counties/:id | GET | anyone | id is the county id | no | returns the county with the specified id | 
/api/environment | GET | anyone | - | no | returns environment variables | 
/api/images | POST | authenticated | form data:<br>- imageType ("user" / "pile")<br>- referenceID is the id of the entity that the image is associated to; if image type is user, the referenceID is ignored and is automatically set as the id of the user making the query<br>- file is the image file<br>- screenshotBase64 (optional); if used, the screenshot is uploaded to s3 and the image file is ignored | no | Returns the saved image | 
/api/images | DELETE | supervisor | query:<br>- <span style="color:red">id</span> is the id of the image to remove from the db | no | 204 | The image is removed from s3 async
/api/improves | GET | admin | - | yes | query:<br>- id is the improve id; if specified, the improvement with that id is returned and every other param is ignored, otherwise, all the improvements are returned<br>- date_start; if specified, only the impovements reported after date start are returned<br>- date_end; if specified, only the impovements reported after date end are returned; both date_start and date_end can be used, or neither.<br>- mail_to; if specified, an email report is sent to the address | 
/api/improves | POST | authenticated | body:<br>- description is a short description of the improve<br>- message | no | the added improve is returned | 
/api/piles | GET | authenticated | query:<br>- id; if specified, the pile with this id is returned and every other param is ignored<br>- filter=\{county:county_id, status:pile_status\}; if either are specified, it returns only the piles in that county / with that status<br>- sort=\{by:pile_property, order: 1/-1\}; both by and order are mandatory if sort is used; by specifies a pile property which should define the sort (name, size); order specifies the sort order, 1 is asc and -1 is desc<br>- contributions; see response for explanation | yes | The query works differently depending on the user role. If the user is a volunteer: a param contributions=true may be specified, in which case only the piles that the user contributed to (ex commented on) are returned, otherwise only the piles created by the user are returned. If user is supervisor: only the piles located in the supervisor's county are returned. If user is admin: all the piles are returned, including the ones that are hidden | 
/api/piles | POST | authenticated | body:<br>- <span style="color:red">location</span>:{lat:x,lng:y}<br>- <span style="color:red">size</span>: 1-5<br>- any other pile property can be set optionally (ex description) | no | the created pile is returned | The pile owner is notified of the pile creation
/api/piles | PUT | supervisor | query:<br>- id is the id of the pile to be edited<br>body:<br>- status<br>- description | no | the updated pile is returned | If the status was changed, the pile owner is notified of the pile update
/api/piles/map | GET | authenticated | - | no | this works differently depending on the user making the query. If the user is admin, all the piles are returned, otherwise all the piles that are not hidden are returned. Additionally, if the user is a volunteer, all the piles with a not pending status and pending piles reported by the user are returned | 
/api/piles/allocate | POST | supervisor | body:<br>- <span style="color:red">due_date</span> is the deadline for the authority to clean the pile<br>- <span style="color:red">authority_id</span><br>- <span style="color:red">pile_id</span> | no | the updated pile is returned, it's status should be "reported" | a pdf containing the pile details is sent to the authority; if the due_date is exceeded, the supervisor is notified
/api/piles/pileConfirmation | POST | authenticated | body:<br>- action must be "confirm" or "unconfirm"<br>- pile is the id of the pile | no | the updated pile is returned | a notification is sent to the user that reported the pile
/api/piles/statistics | POST | admin | body: siruta, date_start, date_end; for the query to work, you must provide either a siruta code for a county, or a date start and date end, or all of them. | no | the piles statistics for the county / period are returned | 
/api/piles/hide | PUT | admin | query:<br>- id is the id of the pile to hide<br>body:<br>- is_hidden (true/false); if is_hidden is set to true, the pile will be hidden | no | the updated pile is returned | 
/api/piles/updateLocation | PUT | supervisor | query:<br>- id is the id of the pile to update<br>body:<br>- location:{lat:x,lng:y},  | no | the updated pile is returned | 
/api/users | GET | admin | query:<br>- id; if specified, the user with this id is returned and the rest of the params are ignored<br>- filter_by defines a property of a user which should be used as a filter (ex "first_name")<br>- filter_query defines the value of the filter (ex "Ion")<br>- sort_by defines a property by which the user should be sorted (ex "email")<br>- sort_order defines the order of the sort; 1 is asc, -1 is desc | yes | if id is specified, returns the user with that id, disregarding any other params. Else, returns an array with the details of all the users | 
/api/users | PUT | admin | query:<br>- id is the id of the user to edit<br>body:<br>any user properties can be sent | no | the updated user is returned | 
/api/users | DELETE | admin | query:<br>- id is the id of the user to be deleted | no | returns the number of users removed | 
/api/users/create_supervisor | POST | admin | body: email, first_name, last_name | no | 200 | An email is sent to the specified mail to revendicate the account
/api/users/statistics | GET | admin | - | no | returns data about all the users | 
/api/users/me | GET | authenticated | - | no | Returns the details of the currently logged in user | 
/api/users/me | PUT | authenticated | body: any params can be sent, some protected user params cannot be updated (ex "created_at") | no | Returns the updated user | 
/api/users/me | DELETE | authenticated | - | no | the user making the query is removed | 
/api/users/stats | GET | authenticated | - | no | returns statistics about the user making the query | 
/api/users/password | PUT | authenticated | body: oldPassword, newPassword | no | 200 | 
/api/users/subscribeDevice | POST | authenticated | body: deviceType, deviceToken | no | 200 | The user will receive notifications on the device
/api/users/unsubscribeDevice | POST | authenticated | body: deviceToken | no | 200 | The user will not receive notifications on the device any more
/api/users | POST | anyone | body: email, password, first_name, last_name | no | returns the created user | An activation email is sent to the created user
/api/users/activate/:token | GET | anyone | token is the activation token sent in the activation mail | no | the user is returned | A status changed email is sent to the user upon activation success
/api/users/resendActivation | POST | anyone | body: email | - | 200 | the activation email is resent to the user with the specified email
/api/users/fpw | POST | anyone | body: email | no | 200 | A reset password email is sent to the specified email
/api/users/reset/:token | GET | anyone | token is the token that will be verified | no | 200 if the token is valid | 
/api/users/reset/:token | PUT | anyone | body:<br>- password<br>url params:<br>- token is the token that will be verified | no | 200 if the token was valid and password was changed | 
/api/users/set_password/:token | GET | anyone | token is used to identify a user created by an admin | no | returns the user if the token is valid | 
/api/users/set_password | POST | anyone | body:<br>- password<br>- token is used to identify a user (created by an admin) that needs to create a password for the first time | no | 200 if the password was set | 

### Deployment ###

#### Building the app ####

Currently, there is no script for building the app. A workaround is to use "grunt serve:production" to start the app (which does the build for you), then stop the app 
And after build the containers for production and push the stack

```
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
```

#### Rebuilding the elastic search index ####

Before a new release, chances are the elastic search indexes need to be rebuild, due to changes in the database models. To do this, there is a sript you can run:

`docker-compose exec node /bin/bash -l -c 'node server/elasticReset.js'`

If everything is successful, the process will end with code 0

### API versioning ###

The API versioning works by running two apps from different branches and using nginx to proxy api requests to each one.

The following is an example config for running the old API on port 9000 and the new one one port 9001. The web app will use the new API. Mobile apps can use old or new.

The new API routes will be prefixed with "v2" and the old ones will remain the same (example: new route is "/api/v2/cities", old route is "/api/cities")

Modify "client/app/config.js", replace "/api/" with "/api/v2/" and "/auth/" with "/auth/v2/". This will tell the web app to use the new API.

```
(function(module){
    'use strict';
    module.constant('API_URL','/api/v2/')
          .constant('AUTH_URL', '/auth/v2/')
})(angular.module('ldrWebApp'));
```

Configure nginx. Here is an example config:

```
server {
      listen 80;
      server_name  example.com;
      location ^~ /api/v2 {
            rewrite ^/api/v2/(.*)$ /api/$1 break;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
            proxy_pass http://localhost:9001;
      }
      location ^~ /api {
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
            proxy_pass http://localhost:9000;
      }
      location ^~ /auth/v2 {
            rewrite ^/auth/v2/(.*)$ /auth/$1 break;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
            proxy_pass http://localhost:9001;
      }
      location ^~ /auth {
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
            proxy_pass http://localhost:9000;
      }
      location / {
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
            proxy_pass http://localhost:9001;
      }
}
```

Start the old app (from branch dev) with "node server/app.js" (it will start on default port 9000)

Start the new app (from branch develop) with "PORT=9001 node server/app.js"


## License

[GPL-3.0 license](https://opensource.org/licenses/GPL-3.0)

