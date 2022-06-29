# Installation Instructions

## Requirements
| Software          | Version                                 |  
|-------------------|-----------------------------------------|
| Operating Systems | MacOS Monteray 12.1<br> Windows 10 Home |
| Git               | 2.32.0                                  |
| Docker            | 20.10.12                                |
| Docker-Compose    | 1.29.2                                  |
| npm               | 6.14.8                                  |
| NodeJS            | 14.15.1                                 |


## Notes
The protocol stack is a full stack implementation of Aries Protocol. In these
installation documents, there will be mentions of Front End and Services.
Front End refers to applications that serve or show the user interface (UI). And
Services refers to APIs and endpoints that provide additional behaviors
to the front end.

## Tools Configuration
Configure the requirements list above according to your preferences and
operating system.

## Docker Configuration
These are the settings to configure docker, independent of operating system used.

| Setting        | Value   |
|----------------|---------|
| CPUs           | 8       |
| Memory         | 8 GB    |
| Sawp           | 3 GB    |
| Disk Image     | 192 GB  |


# Running the system

The system is comprised of two channels:  front end, which is the UI, and the backend which is
comprised of RESTFul services and handles all of the wallet and blockchain interactions.

## Getting the Code
To get started, pull this entire repo down locally.

## Starting the complete system

> Editors note: more detailed instructions exist [here](../README.md).

The default behavior of this repo is to build only our backend stack for testing. But you can build our frontend out, too!

To do so, simply add the --profile frontend to the docker-compose up command. Please note that it takes some time to build out these Docker images.

```
docker-compose --profile frontend up
```

Once the Docker script finishes running (and it may take a while!), you can head to http://localhost:7567 in your browser window to test out our services. (Please note that right now the only UI paths that will work are those related to fingerprint scanning. Verification and Issuing using QR codes or SMS is not currently supported.)


## Only running backend services

```
docker-compose 
```

# Using the code base
The code base is broken up into more granular components.  These instructions will get
you started.  Keep in mind several of components are broken out into other repos so making
changes to those components will require additional setup.  Please see below.

## Front End system
The front end code base starts here:  [ssi-wizard](https://github.com/kiva/ssi-wizard-sdk/).

## Services
The best place to start is with the [protocol-aries code base](https://github.com/kiva/protocol-aries).

1. follow protocol-aries [setup instructions](https://github.com/kiva/protocol-aries#setup) for setup.
2. and for running the services.

### Additional components for the services
[aries-guardianship-agency](https://github.com/kiva/aries-guardianship-agency)    
[aries-key-guardian](https://github.com/kiva/aries-key-guardian.git)    
[protocol-common](https://github.com/kiva/protocol-common.git)    
[protocol](https://github.com/kiva/protocol.git)  






