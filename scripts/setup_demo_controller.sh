#!/bin/bash
# The demo controller is different than the others as it uses the generic aries-controller docker image, so doesn't have
# the setup scripts inside the container. Instead there's a series of curl calls that can be run to accomplish the same affect.
# This is copied from https://github.com/kiva/protocol-demo/blob/main/scripts/setup_controller.sh and any changes there 
# should be reflected here too
set -ev

# Register demo agent
curl --location --request POST 'http://localhost:3014/v2/api/agent/register' \
--header 'agent: demo-agent' \
--header 'Content-Type: application/json' \
--data-raw '{
    "seed": "000000000000000000000000Steward2",
    "label": "Demo Controller",
    "useTailsServer": false,
    "adminApiKey": "demoAdminApiKey"
}'

# Publicize DID
curl --location --request POST 'http://localhost:3014/v1/agent/publicize-did' \
--header 'agent: demo-agent' \
--header 'Content-Type: application/json' \
--data-raw '{
    "did": "EbP4aYNeTHL6q385GuVpRV"
}'

# Add schema and cred def
curl --location --request POST 'http://localhost:3014/v2/api/schema-cred-def' \
--header 'agent: demo-agent' \
--header 'Content-Type: application/json' \
--data-raw '{
    "schemaName": "Identity",
    "attributes": [
        "nationalId",
        "firstName",
        "lastName",
        "birthDate",
        "photo~attach"
    ],
    "schemaVersion": "1.0.0",
    "schemaProfileName": "demo.schema.json",
    "schemaComment": "Identity schema for demo",
    "tag": "tag1",
    "supportRevocation": false,
    "credDefcomment": "Nationa ID card",
    "credDefProfileName": "demo.cred.def.json"
}'

# Add proof requets
curl --location --request POST 'http://localhost:3014/v2/api/profiles' \
--header 'agent: demo-agent' \
--header 'Content-Type: application/json' \
--data-raw '{
    "profileName": "demo.proof.request.json",
    "profile": {
        "comment":"Proof for the demo",
        "proof_request":{
            "name":"Demo",
            "version":"1.0",
            "requested_attributes":{
                "nationalId":{
                    "name":"nationalId",
                    "restrictions": [{
                        "issuer_did":"EbP4aYNeTHL6q385GuVpRV"
                    }]
                },
                "firstName":{
                    "name":"firstName",
                    "restrictions": [{
                        "issuer_did":"EbP4aYNeTHL6q385GuVpRV"
                    }]
                },
                "lastName":{
                    "name":"lastName",
                    "restrictions": [{
                        "issuer_did":"EbP4aYNeTHL6q385GuVpRV"
                    }]
                },
                "birthDate":{
                    "name":"birthDate",
                    "restrictions": [{
                        "issuer_did":"EbP4aYNeTHL6q385GuVpRV"
                    }]
                },
                "photo~attach":{
                    "name":"photo~attach",
                    "restrictions": [{
                        "issuer_did":"EbP4aYNeTHL6q385GuVpRV"
                    }]
                }
            },
            "requested_predicates":{}
        }
    }
}'

curl --location --request POST 'http://localhost:3014/v2/api/profiles' \
--header 'agent: demo-agent' \
--header 'Content-Type: application/json' \
--data-raw '{
    "profileName": "demo.proof.request.json",
    "profile": {
        "comment":"Unrestricted proof for the demo",
        "proof_request":{
            "name":"UnrestrictedDemo",
            "version":"1.0",
            "requested_attributes":{
                "nationalId":{
                    "name":"nationalId",
                    "restrictions": []
                },
                "firstName":{
                    "name":"firstName",
                    "restrictions": []
                },
                "lastName":{
                    "name":"lastName",
                    "restrictions": []
                },
                "birthDate":{
                    "name":"birthDate",
                    "restrictions": []
                },
                "photo~attach":{
                    "name":"photo~attach",
                    "restrictions": []
                }
            },
            "requested_predicates":{}
        }
    }
}'
# Done
