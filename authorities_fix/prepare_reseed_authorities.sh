#!/bin/bash

if [ -z $1 ]; then
	echo "database name not provided"
else
	echo "Backing up..."
	mongodump --host localhost:27017 -d $1
	echo "Done backup. Removing cities, counties"
	mongo --eval 'db.cities.drop();db.counties.drop();' $1
fi

echo "done"
