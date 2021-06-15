#!/bin/sh

helpmsg="""
This script will build an override image for a target repository and use this newly built image in integration tests
instead of the 'latest' image in dockerhub.

Examples:
./setup_override.sh -h
./setup_override.sh -r protocol-gateway
./setup_override.sh -r aries-key-guardian -e scripts/useDummyEnv.sh
./setup_override.sh -r protocol-aries -s fsp-controller,kiva-controller -e scripts/dummy_env.sh
./setup_override.sh -r guardian-bio-auth -s bio_auth_service -f docker-compose.yml -e scripts/useDummyEnvFiles.sh

Required parameters:
    -r <repository name>            Name of the repository to pull down and build

Optional parameters:
    -h                              Display this help message.
    -s <service(s) name(s)>         Name of the service (or comma-separated services) in a multi-service repository to use the built image of.
                                    DEFAULT: <repository name>
    -f <docker-compose file name>   Name of the docker-compose file to build.
                                    DEFAULT: 'docker-compose.ci.yml'
    -e <env var setup script name>  Name of the script to set up environment variables.
                                    DEFAULT: 'scripts/setup_env.sh'
"""

filename='docker-compose.ci.yml'
setup_env_script='scripts/setup_env.sh'

#---
# Handle command line arguments
#---
# Process optional arguments
while getopts ":hr:s:f:e:" opt; do
  case $opt in
  h)
    echo "$helpmsg"
    exit 0
    ;;
  r)
    repository=$OPTARG
    ;;
  s)
    services=$OPTARG
    ;;
  f)
    filename=$OPTARG
    ;;
  e)
    setup_env_script=$OPTARG
    ;;
  \?)
    echo "Invalid option provided -$OPTARG"
    exit 1
    ;;
  :)
    echo "Option -$OPTARG requires an argument." >&2
    exit 1
    ;;
  esac
done

# After getopts is done, shift all processed options away
shift $((OPTIND - 1))

# If no repository name is provided, throw an error
if [ -z "$repository" ]; then
  echo "You must provide the name of one repository to build"
  exit 1
fi

# If no service name is provided, use the name of the repository
if [ -z "$services" ]; then
  services="$repository"
fi


#---
# Build override image(s)
#---
# Pull down repository
mkdir tmp
cd tmp || exit 1
git clone git@github.com:kiva/"$repository".git
cd "$repository" || exit 1

# Build images using provided (or default) docker-compose file name
sh "$setup_env_script"
docker-compose -f "$filename" build
cd ..
rm -rf tmp


#---
# Update .env with override image(s)
# Note: This uses awk in order to be POSIX compliant, as required by Circle CI
#---
# Save override images to override.env
echo "$services" | awk '{
  split($0,arr,",");
  for (i=1; i<=length(arr); i++) {
    key=toupper(arr[i])
    gsub("-", "_", key);
    print key"_IMAGE="arr[i]":latest"
  }
}' > override.env
# Merge override images with values provided by dummy.env (with a preference for override.env)
awk '
  NF && !/^#/ {
    gsub("="," ",$0);
    envvar[$1]=$2;
  } END {
    for(key in envvar) {
      print key"="envvar[key]
    }
  }
' dummy.env override.env > .env
rm override.env
