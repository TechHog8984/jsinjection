#!/usr/bin/env bash

cp jsinjection.js jsinjection_build.js || exit 1

sed -i '/LUAU_CODE_HERE/{
  r ./Luau.Web.js
  d
}' jsinjection_build.js || exit 1
