#!//bin/bash

function deploy {
    if [ -z $1 ]
    then 
        echo '* Enter version number: See package.json for current (and increment before deploying)!'
        return 5
    else
        # Notify begin
        echo Deploying version $1 &&
        # compile JS
        npm run build && 
        # Add working files
        git add . && 
        # Tag  current version
        git tag $1 && 
        # commit
        git commit -m "** : AUTOCOMMIT : tag $1" &&
        # push to github
        git push -u --tags && 
        # publish to npm
        npm publish 
    fi

    return 0
}

deploy $1

# deploy