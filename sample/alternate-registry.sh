#!/bin/bash

# Helper script to launch 2 local alternate registries, for testing purpose

set -eu

if [ $(command -v podman) ]; then
    CONTAINER=podman
elif [ $(command -v docker) ]; then
    CONTAINER=docker
else
    echo "[-] Please install docker or podman."
    exit 1
fi

# Run alternate registries
$CONTAINER rm -f public-registry || true
$CONTAINER rm -f private-registry || true
$CONTAINER run --rm -it -d -p 8000:8000 --name public-registry -e KELLNR_REGISTRY__AUTH_REQUIRED=false ghcr.io/kellnr/kellnr:5.0.0
$CONTAINER run --rm -it -d -p 127.0.0.1:8001:8000 --name private-registry -e KELLNR_REGISTRY__AUTH_REQUIRED=true -e KELLNR_ORIGIN__PORT=8001 ghcr.io/kellnr/kellnr:5.0.0

# Push crate to `public-registry`
cd $(mktemp -d)
cargo init external --registry public-registry
cd external
cargo publish --allow-dirty --index "sparse+http://localhost:8000/api/v1/crates/" --token "Zy9HhJ02RJmg0GCrgLfaCVfU6IwDfhXD"

# Push crate to `private-registry`
cd $(mktemp -d)
cargo init external2 --registry private-registry
cd external2
cargo publish -v --allow-dirty --index "sparse+http://localhost:8001/api/v1/crates/" --token "Zy9HhJ02RJmg0GCrgLfaCVfU6IwDfhXD"

# Check
curl --fail-with-body http://localhost:8000/api/v1/crates/ex/te/external
curl --fail-with-body -H "Authorization: Zy9HhJ02RJmg0GCrgLfaCVfU6IwDfhXD" http://localhost:8001/api/v1/crates/ex/te/external2

echo -e "\n\nhttp://localhost:8000"
echo -e "http://localhost:8001"

echo '
----------------
[registry]
global-credential-providers = ["cargo:token"]

[registries]
public-registry = { index = "sparse+http://localhost:8000/api/v1/crates/" }

[registries.private-registry]
index = "sparse+http://localhost:8001/api/v1/crates/"
token = "Zy9HhJ02RJmg0GCrgLfaCVfU6IwDfhXD"
----------------
'
