#!/usr/bin/env bash

cp src/jsinjection.js jsinjection_build.js || exit 1

sed -i '/LUAU_CODE_HERE/{
  r dependencies/Luau.Web.js
  d
}' jsinjection_build.js || exit 1
