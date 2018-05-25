#!///bin/bash

# compile JS
npm run build && 

# publish to npm
npm publish && 

# push to github
git push -u