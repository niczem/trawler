#!/bin/bash
#this file generates a readme.md based on the
#description in the datasources index files

for f in ../datasources/*/index.js; do
  se=$(sed -n 2,2p $f);
  nse="${se//* @file/}"
  headline=$(cut -d'*' -f3 <<<"$nse")
  description=$(cut -d'*' -f5 <<<"$nse")
  if [ "$headline" != "" ]; then
    markdown="$markdown
   - **$headline**
  $description"
  fi
done

template=`cat README.template.md`

readme="${template/INCLUDE_DATASOURCES_STRING/"$markdown"}"    

echo "$readme" > ../README.md