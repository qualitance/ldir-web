#!/bin/bash

if [ -z $1 ]; then
	echo "database name not provided"
else
	mongo --eval 'db.authorities.drop();db.authorities_new.renameCollection("authorities");' $1
fi

echo "done"
