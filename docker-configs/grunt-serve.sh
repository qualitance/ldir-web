#!/usr/bin/env bash
#Fixes utf=8 encodings issues
npm install --loglevel silent
bower install  --allow-root
export LC_ALL="C.UTF-8"
grunt serve:development
